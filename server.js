// Production server: serves the built Vite app from dist/ and a small JSON API
// for the inquiry form and the admin inbox. Inquiries are kept in a JSON file
// under DATA_DIR, so this needs a host with a persistent disk (not a
// serverless platform).
import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8787);
const isProduction = process.env.NODE_ENV === "production";
// No fallback in production: without ADMIN_PASSWORD the admin API refuses
// every request instead of running with a guessable default.
const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? "" : "mollie-admin");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, "data"));
const dataFile = path.join(dataDir, "inquiries.json");
const distDir = path.join(__dirname, "dist");

const fieldLimits = {
  name: 90,
  email: 150,
  phone: 40,
  interest: 40,
  riderLevel: 60,
  horseName: 90,
  horseAge: 80,
  preferredContact: 40,
  timeline: 60,
  message: 1000,
};

const statuses = new Set(["new", "contacted", "booked", "archived"]);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".pdf", "application/pdf"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
]);

function normalizeText(value, max) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeInquiry(body) {
  const inquiry = Object.fromEntries(
    Object.entries(fieldLimits).map(([field, limit]) => [field, normalizeText(body[field], limit)]),
  );
  inquiry.newsletter = Boolean(body.newsletter);
  return inquiry;
}

function validateInquiry(inquiry) {
  if (inquiry.name.length < 2) return "Name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) return "Valid email is required.";
  if (inquiry.message.length < 8) return "Please include a short note for Mollie.";
  return null;
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64_000) {
      throw new Error("Request body is too large.");
    }
  }
  return body ? JSON.parse(body) : {};
}

async function readInquiries() {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// Write to a temp file, then rename: the rename is atomic, so a crash mid-write
// can never leave a half-written inquiries.json behind.
async function writeInquiries(inquiries) {
  await mkdir(dataDir, { recursive: true });
  const temporaryFile = `${dataFile}.${Date.now()}-${randomUUID()}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(inquiries, null, 2)}\n`, "utf8");
  await rename(temporaryFile, dataFile);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(text);
}

// The admin UI sends the password as a Bearer token. The X-Admin-Key header and
// ?key= query are also accepted; avoid ?key= since URLs end up in history and logs.
function getAdminKey(request, url) {
  const header = request.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return request.headers["x-admin-key"] || url.searchParams.get("key") || "";
}

function isAuthorized(request, url) {
  if (!adminPassword) return false;
  const supplied = Buffer.from(String(getAdminKey(request, url)));
  const expected = Buffer.from(String(adminPassword));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function toCsv(inquiries) {
  const headers = [
    "createdAt",
    "status",
    "name",
    "email",
    "phone",
    "interest",
    "riderLevel",
    "horseName",
    "horseAge",
    "preferredContact",
    "timeline",
    "message",
    "newsletter",
  ];
  const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...inquiries.map((inquiry) => headers.map((header) => escapeCell(inquiry[header])).join(",")),
  ].join("\n");
}

async function handleApi(request, response, url) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Admin-Key",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Origin": "*",
    });
    response.end();
    return;
  }

  if (url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/inquiries" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const inquiry = normalizeInquiry(body);
      const validationError = validateInquiry(inquiry);

      if (validationError) {
        sendJson(response, 400, { error: validationError });
        return;
      }

      const inquiries = await readInquiries();
      const created = {
        id: randomUUID(),
        status: "new",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...inquiry,
      };

      inquiries.unshift(created);
      await writeInquiries(inquiries);
      sendJson(response, 201, { inquiry: created });
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Invalid inquiry." });
    }
    return;
  }

  if (url.pathname === "/api/admin/inquiries" && request.method === "GET") {
    if (!isAuthorized(request, url)) {
      sendJson(response, 401, { error: "Admin password is wrong or missing." });
      return;
    }

    const inquiries = await readInquiries();
    sendJson(response, 200, { inquiries });
    return;
  }

  if (url.pathname === "/api/admin/inquiries.csv" && request.method === "GET") {
    if (!isAuthorized(request, url)) {
      sendJson(response, 401, { error: "Admin password is wrong or missing." });
      return;
    }

    const inquiries = await readInquiries();
    sendText(response, 200, toCsv(inquiries), "text/csv; charset=utf-8");
    return;
  }

  const match = url.pathname.match(/^\/api\/admin\/inquiries\/([^/]+)$/);
  if (match && request.method === "PATCH") {
    if (!isAuthorized(request, url)) {
      sendJson(response, 401, { error: "Admin password is wrong or missing." });
      return;
    }

    const body = await readJsonBody(request);
    const nextStatus = normalizeText(body.status, 20);
    if (!statuses.has(nextStatus)) {
      sendJson(response, 400, { error: "Unsupported inquiry status." });
      return;
    }

    const inquiries = await readInquiries();
    const index = inquiries.findIndex((inquiry) => inquiry.id === match[1]);
    if (index === -1) {
      sendJson(response, 404, { error: "Inquiry not found." });
      return;
    }

    inquiries[index] = {
      ...inquiries[index],
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    await writeInquiries(inquiries);
    sendJson(response, 200, { inquiry: inquiries[index] });
    return;
  }

  sendJson(response, 404, { error: "API route not found." });
}

async function serveStatic(request, response, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const safePath = path
    .normalize(decodeURIComponent(url.pathname))
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]/, "");
  const requestedFile = path.join(distDir, safePath || "index.html");
  const fallbackFile = path.join(distDir, "index.html");
  const fileToServe = await stat(requestedFile)
    .then((stats) => (stats.isFile() ? requestedFile : fallbackFile))
    .catch(() => fallbackFile);

  const contentType = mimeTypes.get(path.extname(fileToServe)) || "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": fileToServe.endsWith("index.html") ? "no-store" : "public, max-age=31536000",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(fileToServe).pipe(response);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    await serveStatic(request, response, url);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error." });
  }
});

server.listen(port, () => {
  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD is required before the admin API will unlock.");
  }
  console.log(`Mollie Bachner backend running on http://localhost:${port}`);
});
