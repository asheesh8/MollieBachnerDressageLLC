import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Menu,
  Phone,
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
  legacyAssets,
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
];

const saleCards = [
  ["ADOPTED", "Unico", "Forever home with Laura in Vermont.", "/assets/unico-training.jpg"],
  ["SOLD", "Andy", "Congratulations to Lucy in Connecticut.", "/assets/andymountedsalepg-2.jpg"],
  ["SOLD", 'Bon Voyage "Ope"', "Congratulations to Gretchen in Massachusetts.", "/assets/ope08-2015-1.jpg"],
  ["SOLD", 'Heaven Sent "Bailey"', "Congratulations to Veralynn in Maryland.", "/assets/bailey.jpg"],
  ["SOLD", "Independencia", "Congratulations to Amanda in Maryland.", "/assets/indie.jpg"],
];

function App() {
  const [view, setView] = useState("home");
  const [activeService, setActiveService] = useState(services[0].id);
  const [activePhoto, setActivePhoto] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [galleryPage, setGalleryPage] = useState(0);

  const service = useMemo(
    () => services.find((item) => item.id === activeService) ?? services[0],
    [activeService],
  );
  const contactHref = `mailto:${email}`;

  const showView = (id) => {
    setView(id);
    setMobileNavOpen(false);
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
            </div>
          </section>
        )}

        {view === "archive" && (
          <ArchiveScreen
            galleryPage={galleryPage}
            setGalleryPage={setGalleryPage}
            onOpen={setActivePhoto}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>©2024 Mollie Bachner Dressage LLC</span>
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
          <h2>Every usable photo, without the endless scroll.</h2>
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

      <div className="legacy-row" aria-label="Legacy visual assets">
        {legacyAssets.map((asset) => (
          <figure key={asset.src}>
            <img src={asset.src} alt={asset.title} />
          </figure>
        ))}
      </div>
    </section>
  );
}

export default App;
