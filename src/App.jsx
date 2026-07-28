import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Menu,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";
import {
  aboutBlocks,
  clinicArchive,
  email,
  gallery,
  herd,
  heroPhotos,
  navItems,
  phone,
  services,
  stats,
} from "./content.js";

const views = [
  { id: "home", label: "Home" },
  ...navItems.map((item) => ({
    id: item.href.replace("#", ""),
    label: item.label,
  })),
  { id: "inquiry", label: "Inquiry" },
  { id: "admin", label: "Admin" },
];

const saleCards = [
  ["ADOPTED", "Unico", "Forever home with Laura in Vermont.", "/assets/unico-training.jpg"],
  ["SOLD", "Andy", "Congratulations to Lucy in Connecticut.", "/assets/andymountedsalepg-2.jpg"],
  ["SOLD", 'Bon Voyage "Ope"', "Congratulations to Gretchen in Massachusetts.", "/assets/ope08-2015-1.jpg"],
  ["SOLD", 'Heaven Sent "Bailey"', "Congratulations to Veralynn in Maryland.", "/assets/bailey.jpg"],
  ["SOLD", "Independencia", "Congratulations to Amanda in Maryland.", "/assets/indie.jpg"],
];

const inquiryDefaults = {
  name: "",
  email: "",
  phone: "",
  interest: "Lessons",
  riderLevel: "Adult amateur",
  horseName: "",
  horseAge: "",
  preferredContact: "Email",
  timeline: "Flexible",
  message: "",
  newsletter: false,
};

const adminStatuses = ["new", "contacted", "booked", "archived"];

const getSavedAdminKey = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("mbdAdminKey") ?? "";
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

function App() {
  const [view, setView] = useState("home");
  const [activeService, setActiveService] = useState(services[0].id);
  const [activePhoto, setActivePhoto] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [galleryPage, setGalleryPage] = useState(0);
  const [inquiryForm, setInquiryForm] = useState(inquiryDefaults);
  const [inquiryStatus, setInquiryStatus] = useState({ state: "idle", message: "" });
  const [adminKey, setAdminKey] = useState(getSavedAdminKey);
  const [adminSubmissions, setAdminSubmissions] = useState([]);
  const [adminStatus, setAdminStatus] = useState({
    state: "idle",
    message: "Enter the admin password to load fresh inquiries.",
  });
  const [adminFilter, setAdminFilter] = useState("all");

  const service = useMemo(
    () => services.find((item) => item.id === activeService) ?? services[0],
    [activeService],
  );
  const filteredAdminSubmissions = useMemo(
    () =>
      adminFilter === "all"
        ? adminSubmissions
        : adminSubmissions.filter((submission) => submission.status === adminFilter),
    [adminFilter, adminSubmissions],
  );
  const contactHref = `mailto:${email}`;

  useEffect(() => {
    if (view === "admin" && adminKey) {
      loadAdminSubmissions(adminKey);
    }
  }, [view]);

  const showView = (id) => {
    setView(id);
    setMobileNavOpen(false);
  };

  const showLightboxPhoto = (direction) => {
    if (!activePhoto) return;

    const source = gallery.some((photo) => photo.src === activePhoto.src) ? gallery : heroPhotos;
    const index = source.findIndex((photo) => photo.src === activePhoto.src);
    const nextIndex = (index + direction + source.length) % source.length;
    setActivePhoto(source[nextIndex]);
  };

  const updateInquiryField = (field, value) => {
    setInquiryForm((current) => ({ ...current, [field]: value }));
  };

  const submitInquiry = async (event) => {
    event.preventDefault();
    setInquiryStatus({ state: "loading", message: "Sending inquiry..." });

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiryForm),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not save the inquiry.");
      }

      setInquiryForm(inquiryDefaults);
      setInquiryStatus({
        state: "success",
        message: "Saved. Mollie can now see this in the admin dashboard.",
      });
      if (adminKey) {
        loadAdminSubmissions(adminKey);
      }
    } catch (error) {
      setInquiryStatus({
        state: "error",
        message: error.message || "Something went wrong. Please try again.",
      });
    }
  };

  async function loadAdminSubmissions(key = adminKey) {
    if (!key) {
      setAdminStatus({ state: "error", message: "Admin password is required." });
      return;
    }

    setAdminStatus({ state: "loading", message: "Loading inquiries..." });
    try {
      const response = await fetch("/api/admin/inquiries", {
        headers: { Authorization: `Bearer ${key}` },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not load inquiries.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("mbdAdminKey", key);
      }
      setAdminSubmissions(payload.inquiries || []);
      setAdminStatus({
        state: "success",
        message: `${payload.inquiries?.length || 0} inquiries loaded.`,
      });
    } catch (error) {
      setAdminStatus({
        state: "error",
        message: error.message || "Could not load inquiries.",
      });
    }
  }

  const updateSubmissionStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not update inquiry.");
      }

      setAdminSubmissions((items) =>
        items.map((item) => (item.id === id ? payload.inquiry : item)),
      );
      setAdminStatus({ state: "success", message: "Inquiry status updated." });
    } catch (error) {
      setAdminStatus({
        state: "error",
        message: error.message || "Could not update inquiry.",
      });
    }
  };

  const downloadAdminCsv = async () => {
    try {
      const response = await fetch("/api/admin/inquiries.csv", {
        headers: { Authorization: `Bearer ${adminKey}` },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Could not export inquiries.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mollie-bachner-inquiries.csv";
      link.click();
      URL.revokeObjectURL(url);
      setAdminStatus({ state: "success", message: "CSV export downloaded." });
    } catch (error) {
      setAdminStatus({
        state: "error",
        message: error.message || "Could not export inquiries.",
      });
    }
  };

  return (
    <div className="app-frame">
      <header className="topbar">
        <button className="brand-mark" type="button" onClick={() => showView("home")}>
          <img src="/assets/molliebachnerdressage.png" alt="Mollie Bachner Dressage" />
        </button>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {views.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "is-active" : ""}
              type="button"
              onClick={() => showView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <a className="icon-button" href={contactHref} title="Email Mollie" aria-label="Email Mollie">
            <Mail size={19} />
          </a>
          <button
            className="icon-button mobile-only"
            type="button"
            title="Open menu"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="mobile-panel" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button
            className="icon-button close-button"
            type="button"
            title="Close menu"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={21} />
          </button>
          {views.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "is-active" : ""}
              type="button"
              onClick={() => showView(item.id)}
            >
              {item.label}
            </button>
          ))}
          <a className="mobile-contact" href={contactHref}>
            <Mail size={18} />
            {email}
          </a>
        </div>
      )}

      <main className={`stage stage-${view}`}>
        <div className="view-meta">
          <span>{String(views.findIndex((item) => item.id === view) + 1).padStart(2, "0")}</span>
          <strong>{views.find((item) => item.id === view)?.label}</strong>
        </div>

        {view === "home" && (
          <section className="screen home-screen">
            <div className="copy-zone">
              <p className="eyebrow">Dressage LLC / Vermont and New England</p>
              <h1>Mollie Bachner Dressage</h1>
              <p>
                USDF Bronze, Silver, and Gold medalist Mollie Bachner specializes in starting
                young horses and training them to the FEI levels. She teaches riders of all ages
                and levels, helping them accomplish their goals through Grand Prix experience.
              </p>
              <div className="hero-actions">
                <button className="primary-cta" type="button" onClick={() => showView("about")}>
                  Contact Mollie
                  <ArrowUpRight size={19} />
                </button>
                <button className="text-link" type="button" onClick={() => showView("inquiry")}>
                  Start inquiry
                  <ClipboardList size={17} />
                </button>
                <button className="text-link" type="button" onClick={() => showView("archive")}>
                  Photo archive
                  <Camera size={17} />
                </button>
              </div>
            </div>
            <PhotoConstellation photos={heroPhotos} onOpen={setActivePhoto} />
            <div className="stats-strip" aria-label="Practice highlights">
              {stats.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === "training" && (
          <section className="screen service-screen">
            <div className="service-tabs" aria-label="Service selector">
              {services.map((item) => (
                <button
                  key={item.id}
                  className={item.id === activeService ? "is-active" : ""}
                  type="button"
                  onClick={() => setActiveService(item.id)}
                >
                  {item.eyebrow}
                </button>
              ))}
            </div>
            <img className="service-hero-image" src={service.image} alt={service.title} />
            <div className="service-copy">
              <p className="eyebrow">{service.eyebrow}</p>
              <h2>{service.title}</h2>
              <p>{service.details}</p>
              <ul>
                {service.points.map((point) => (
                  <li key={point}>
                    <CheckCircle2 size={17} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {view === "lessons" && (
          <section className="screen lessons-screen">
            <div className="copy-zone">
              <p className="eyebrow">Lessons and Clinics</p>
              <h2>For children, adults, and riders growing toward the next level.</h2>
              <p>
                Mollie offers lessons throughout New England, clinics year-round, travel for
                clinics and lessons, and coaching at shows. Her clinic work emphasizes balance,
                relaxation, confidence, throughness, and harmony.
              </p>
            </div>
            <div className="lesson-stack">
              <img src="/assets/mollie-lesson-2.jpg" alt="Dressage lesson" />
              <img src="/assets/clinic2.jpg" alt="Clinic ride" />
            </div>
            <div className="flyer-panel">
              {clinicArchive.map((item) => (
                <a className="download-row" href={item.file} key={item.file} target="_blank" rel="noreferrer">
                  <Download size={18} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.dates}</small>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {view === "sales" && (
          <section className="screen sales-screen">
            <div className="copy-zone">
              <p className="eyebrow">Horses For Sale</p>
              <h2>Current inquiries and past matches.</h2>
              <p>
                Mollie often has clients with horses available. If you are looking for something
                specific, contact Mollie.
              </p>
            </div>
            <div className="sales-grid">
              {saleCards.map(([status, name, note, image]) => (
                <article className="sale-card" key={name}>
                  <img src={image} alt={name} />
                  <div>
                    <span>{status}</span>
                    <h3>{name}</h3>
                    <p>{note}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === "herd" && (
          <section className="screen herd-screen">
            <div className="copy-zone">
              <p className="eyebrow">The Herd</p>
              <h2>Owned by Mollie, loved at the barn.</h2>
              <p>
                This page is dedicated to the critters owned by Mollie. Some of them may be
                available for sale, so contact Mollie if you are interested in learning more.
              </p>
            </div>
            <div className="herd-grid">
              {herd.map((member) => (
                <article className="herd-card" key={member.name}>
                  <img src={member.image} alt={member.name} />
                  <div>
                    <span>{member.nickname}</span>
                    <h3>{member.name}</h3>
                    <p>{member.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === "about" && (
          <section className="screen about-screen">
            <div className="about-grid">
              {aboutBlocks.map((block) => (
                <article key={block.title} className="about-card">
                  <img src={block.image} alt={block.title} />
                  <div>
                    <h3>{block.title}</h3>
                    <p>{block.copy}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="contact-panel">
              <p className="eyebrow">About and Contact</p>
              <h2>Grand Prix experience with a generous, horse-first teaching style.</h2>
              <div className="contact-links">
                <a href={contactHref}>
                  <Mail size={18} />
                  {email}
                </a>
                <a href={`tel:${phone.replace(/-/g, "")}`}>
                  <Phone size={18} />
                  {phone}
                </a>
                <a href="https://www.facebook.com/MollieBachnerDressageLLC" target="_blank" rel="noreferrer">
                  <ExternalLink size={18} />
                  Facebook
                </a>
                <span>
                  <MapPin size={18} />
                  Burlington, VT area
                </span>
              </div>
              <button className="primary-cta compact-cta" type="button" onClick={() => showView("inquiry")}>
                Start Inquiry
                <ArrowUpRight size={18} />
              </button>
            </div>
          </section>
        )}

        {view === "inquiry" && (
          <InquiryScreen
            form={inquiryForm}
            status={inquiryStatus}
            onChange={updateInquiryField}
            onSubmit={submitInquiry}
          />
        )}

        {view === "archive" && (
          <ArchiveScreen
            galleryPage={galleryPage}
            setGalleryPage={setGalleryPage}
            onOpen={setActivePhoto}
          />
        )}

        {view === "admin" && (
          <AdminScreen
            adminKey={adminKey}
            filter={adminFilter}
            filteredSubmissions={filteredAdminSubmissions}
            status={adminStatus}
            submissions={adminSubmissions}
            onDownload={downloadAdminCsv}
            onFilter={setAdminFilter}
            onKeyChange={setAdminKey}
            onRefresh={loadAdminSubmissions}
            onStatusChange={updateSubmissionStatus}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>©2024 Mollie Bachner Dressage LLC</span>
        <button type="button" onClick={() => showView("admin")}>
          Admin
        </button>
        <a href={contactHref}>{email}</a>
      </footer>

      {activePhoto && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={activePhoto.title}>
          <button
            className="icon-button lightbox-close"
            type="button"
            title="Close photo"
            aria-label="Close photo"
            onClick={() => setActivePhoto(null)}
          >
            <X size={23} />
          </button>
          <button
            className="icon-button lightbox-nav lightbox-prev"
            type="button"
            title="Previous photo"
            aria-label="Previous photo"
            onClick={() => showLightboxPhoto(-1)}
          >
            <ArrowLeft size={22} />
          </button>
          <button
            className="icon-button lightbox-nav lightbox-next"
            type="button"
            title="Next photo"
            aria-label="Next photo"
            onClick={() => showLightboxPhoto(1)}
          >
            <ArrowRight size={22} />
          </button>
          <img src={activePhoto.src} alt={activePhoto.title} />
          <div>
            <strong>{activePhoto.title}</strong>
            {activePhoto.group && <span>{activePhoto.group}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function InquiryScreen({ form, status, onChange, onSubmit }) {
  return (
    <section className="screen inquiry-screen">
      <div className="copy-zone inquiry-copy">
        <p className="eyebrow">New Client Intake</p>
        <h2>Start the conversation with the right details.</h2>
        <p>
          Riders, owners, parents, and clinic hosts can send one organized note. Mollie sees it
          in the admin dashboard with contact details, riding goals, timing, and service interest.
        </p>
        <div className="intake-notes" aria-label="Inquiry workflow">
          <span>
            <strong>01</strong>
            Save the inquiry
          </span>
          <span>
            <strong>02</strong>
            Review in admin
          </span>
          <span>
            <strong>03</strong>
            Follow up fast
          </span>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-panel-head">
          <ClipboardList size={25} />
          <div>
            <h3>Inquiry form</h3>
            <p>Everything Mollie needs before calling back.</p>
          </div>
        </div>

        <form className="inquiry-form" onSubmit={onSubmit}>
          <label>
            <span>Name</span>
            <input
              required
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Rider or owner"
            />
          </label>

          <label>
            <span>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="name@email.com"
            />
          </label>

          <label>
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder="802-299-7121"
            />
          </label>

          <label>
            <span>Interest</span>
            <select value={form.interest} onChange={(event) => onChange("interest", event.target.value)}>
              <option>Lessons</option>
              <option>Training</option>
              <option>Clinics</option>
              <option>Sales</option>
              <option>Sponsorship</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            <span>Rider level</span>
            <select value={form.riderLevel} onChange={(event) => onChange("riderLevel", event.target.value)}>
              <option>Beginner</option>
              <option>Adult amateur</option>
              <option>Junior rider</option>
              <option>Professional</option>
              <option>FEI / advanced</option>
              <option>Horse owner</option>
            </select>
          </label>

          <label>
            <span>Timeline</span>
            <select value={form.timeline} onChange={(event) => onChange("timeline", event.target.value)}>
              <option>This week</option>
              <option>This month</option>
              <option>Before show season</option>
              <option>Flexible</option>
            </select>
          </label>

          <label>
            <span>Horse</span>
            <input
              value={form.horseName}
              onChange={(event) => onChange("horseName", event.target.value)}
              placeholder="Name or TBD"
            />
          </label>

          <label>
            <span>Horse age</span>
            <input
              value={form.horseAge}
              onChange={(event) => onChange("horseAge", event.target.value)}
              placeholder="Age / breed"
            />
          </label>

          <label>
            <span>Contact by</span>
            <select
              value={form.preferredContact}
              onChange={(event) => onChange("preferredContact", event.target.value)}
            >
              <option>Email</option>
              <option>Phone call</option>
              <option>Text</option>
            </select>
          </label>

          <label className="full-field">
            <span>Goals and notes</span>
            <textarea
              required
              value={form.message}
              onChange={(event) => onChange("message", event.target.value)}
              placeholder="Tell Mollie what you are working on, where the horse is located, and any scheduling notes."
            />
          </label>

          <label className="checkbox-field full-field">
            <input
              type="checkbox"
              checked={form.newsletter}
              onChange={(event) => onChange("newsletter", event.target.checked)}
            />
            <span>Okay to email about future clinics and openings.</span>
          </label>

          <div className="form-actions full-field">
            <button className="primary-cta" type="submit" disabled={status.state === "loading"}>
              {status.state === "loading" ? "Saving" : "Send Inquiry"}
              <Send size={18} />
            </button>
            {status.message && <p className={`form-status is-${status.state}`}>{status.message}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}

function AdminScreen({
  adminKey,
  filter,
  filteredSubmissions,
  status,
  submissions,
  onDownload,
  onFilter,
  onKeyChange,
  onRefresh,
  onStatusChange,
}) {
  const newCount = submissions.filter((submission) => submission.status === "new").length;

  return (
    <section className="screen admin-screen">
      <div className="admin-side">
        <p className="eyebrow">Backend Admin</p>
        <h2>Lead desk for Mollie.</h2>
        <p>
          Review form submissions, mark follow-up status, and export a clean CSV for a notebook
          or spreadsheet.
        </p>

        <form className="admin-login" onSubmit={(event) => {
          event.preventDefault();
          onRefresh(adminKey);
        }}>
          <label>
            <span>Admin password</span>
            <input
              type="password"
              value={adminKey}
              onChange={(event) => onKeyChange(event.target.value)}
              placeholder="ADMIN_PASSWORD"
            />
          </label>
          <button className="primary-cta" type="submit">
            Unlock
            <ShieldCheck size={18} />
          </button>
        </form>

        <div className="admin-stats">
          <span>
            <strong>{submissions.length}</strong>
            Total
          </span>
          <span>
            <strong>{newCount}</strong>
            New
          </span>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div>
            <h3>Submissions</h3>
            <p className={`form-status is-${status.state}`}>{status.message}</p>
          </div>
          <div className="admin-buttons">
            <button type="button" onClick={() => onRefresh(adminKey)} title="Refresh inquiries">
              <RefreshCw size={17} />
            </button>
            <button type="button" onClick={onDownload} title="Download CSV">
              <Download size={17} />
            </button>
          </div>
        </div>

        <div className="admin-filter" aria-label="Submission status filter">
          {["all", ...adminStatuses].map((item) => (
            <button
              key={item}
              className={filter === item ? "is-active" : ""}
              type="button"
              onClick={() => onFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="submission-list">
          {filteredSubmissions.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={30} />
              <strong>No inquiries here yet.</strong>
              <span>Send the form once and it will appear in this admin panel.</span>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <article className="submission-card" key={submission.id}>
                <div className="submission-main">
                  <div>
                    <span>{submission.interest}</span>
                    <h3>{submission.name}</h3>
                    <p>{submission.message}</p>
                  </div>
                  <select
                    value={submission.status}
                    onChange={(event) => onStatusChange(submission.id, event.target.value)}
                  >
                    {adminStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <dl>
                  <div>
                    <dt>Email</dt>
                    <dd>{submission.email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{submission.phone || "Not given"}</dd>
                  </div>
                  <div>
                    <dt>Level</dt>
                    <dd>{submission.riderLevel}</dd>
                  </div>
                  <div>
                    <dt>Horse</dt>
                    <dd>{[submission.horseName, submission.horseAge].filter(Boolean).join(" / ") || "TBD"}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>{submission.preferredContact}</dd>
                  </div>
                  <div>
                    <dt>Sent</dt>
                    <dd>{formatDate(submission.createdAt)}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function PhotoConstellation({ photos, onOpen }) {
  return (
    <div className="photo-constellation" aria-label="Featured photos">
      {photos.map((photo, index) => (
        <button
          className={`hero-photo hero-photo-${index + 1}`}
          key={photo.src}
          type="button"
          onClick={() => onOpen(photo)}
        >
          <img src={photo.src} alt={photo.title} />
          <span>{photo.tag}</span>
        </button>
      ))}
      <div className="stamp" aria-hidden="true">
        <Trophy size={24} />
        <span>USDF</span>
        <strong>3 medals</strong>
      </div>
    </div>
  );
}

function ArchiveScreen({ galleryPage, setGalleryPage, onOpen }) {
  const perPage = 12;
  const totalPages = Math.ceil(gallery.length / perPage);
  const pageItems = gallery.slice(galleryPage * perPage, galleryPage * perPage + perPage);

  return (
    <section className="screen archive-screen">
      <div className="archive-head">
        <div>
          <p className="eyebrow">Complete Photo Archive</p>
          <h2>Original site photography.</h2>
          <p className="archive-summary">
            Competition, training, clinic, sales, herd, and about images from Mollie's site.
          </p>
        </div>
        <div className="pager">
          <button type="button" onClick={() => setGalleryPage((galleryPage - 1 + totalPages) % totalPages)}>
            <ArrowLeft size={18} />
          </button>
          <span>
            {galleryPage + 1} / {totalPages}
          </span>
          <button type="button" onClick={() => setGalleryPage((galleryPage + 1) % totalPages)}>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="gallery-grid">
        {pageItems.map((photo, index) => (
          <button
            className={`gallery-tile tile-${(index % 6) + 1}`}
            key={`${photo.src}-${photo.title}`}
            type="button"
            onClick={() => onOpen(photo)}
          >
            <img src={photo.src} alt={photo.title} />
            <span>
              <strong>{photo.title}</strong>
              <small>{photo.group}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default App;
