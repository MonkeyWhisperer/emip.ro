import { Link } from "react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { contact, footerNav, legalNav, social } from "../../content/site";
import { Container } from "../ui/Section";
import { Logo } from "../ui/Logo";
import { SocialIcon } from "../ui/SocialIcon";

const headingClass = "text-sm font-semibold uppercase tracking-wider text-white";
const linkClass = "text-slate-300 transition-colors hover:text-brand-300";

// One-line rows with an icon: the text box is trimmed to the letters (cap height to baseline), so
// centring it centres the icon on the letters themselves at any zoom, instead of on the line box,
// whose position browsers round differently per zoom level. min-h-5 keeps the untrimmed row
// height; on a link, py/-my restore the untrimmed click and focus area without changing layout.
const iconRowClass = "flex min-h-5 items-center gap-3";
const iconRowTextClass = "[text-box:trim-both_cap_alphabetic]";
const iconRowLinkClass = `${iconRowTextClass} -my-[5px] py-[5px] ${linkClass}`;

export function Footer() {
  const socialLinks = social.filter((s) => s.href && !s.hidden);

  return (
    // --footer-lead: width shared by the description column and the copyright block below it
    // (the copyright's longest line is ~491px), so the two line up exactly.
    <footer className="bg-navy-950 text-sm text-slate-300 [--footer-lead:30.75rem]">
      {/* From xl: the description is as wide as the copyright block, the other columns take their
          natural width and share the remaining space. 2×2 below xl so no column gets cramped. */}
      <Container className="grid gap-12 py-12 sm:grid-cols-2 xl:grid-cols-[var(--footer-lead)_auto_auto_auto] xl:justify-between xl:gap-8">

        <div>
          <Logo />
          <p className="mt-5 leading-relaxed">
            Platforma eMIP pentru managementul proiectelor cu finanțare din fonduri europene. Raportare MIPE automată,
            conformitate cu cerințele finanțatorului, productivitate sporită, colaborare în echipă și un grad ridicat de
            securitate.
          </p>
          {socialLinks.length > 0 && (
            <ul className="mt-6 flex gap-3">
              {socialLinks.map((s) => (
                <li key={s.network}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex size-9 items-center justify-center rounded-full bg-white/5 text-slate-200 transition-colors hover:bg-brand-400 hover:text-navy-950"
                  >
                    <SocialIcon network={s.network} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Navigare rapidă">
          <h2 className={headingClass}>Navigare rapidă</h2>
          {/* Two columns filled top to bottom (column-major), so each column reads as a list; sized
              to their links, so the gap between them is the same at every width. */}
          <ul
            className="mt-5 grid grid-flow-col grid-cols-[repeat(2,max-content)] gap-x-12 gap-y-3"
            style={{ gridTemplateRows: `repeat(${Math.ceil(footerNav.length / 2)}, auto)` }}
          >
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={headingClass}>Ne găsiți aici</h2>
          {/* The pin's tip starts level with the tops of the address letters. */}
          <ul className="mt-5 space-y-4">
            <li className="flex items-start gap-3">
              <MapPin aria-hidden className="mt-[0.27rem] size-4 shrink-0 text-brand-400" />
              <address className="not-italic">
                {contact.street}
                <br />
                {contact.city}
              </address>
            </li>
            <li className={iconRowClass}>
              <Phone aria-hidden className="size-4 shrink-0 text-brand-400" />
              <a href={contact.phoneHref} className={iconRowLinkClass}>
                {contact.phone}
              </a>
            </li>
            <li className={iconRowClass}>
              <Mail aria-hidden className="size-4 shrink-0 text-brand-400" />
              <a href={`mailto:${contact.email}`} className={iconRowLinkClass}>
                {contact.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={headingClass}>Program</h2>
          <ul className="mt-5 space-y-3">
            {contact.hours.map((h) => (
              <li key={h.days} className={iconRowClass}>
                <Clock aria-hidden className="size-4 shrink-0 text-brand-400" />
                <span className={iconRowTextClass}>
                  <span className="text-white">{h.days}:</span> {h.time}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* pb-24 keeps the legal links clear of the floating chat button (fixed bottom right, it ends
          76px above the window's edge) once the page is scrolled to the end; from 2xl the side
          margin is wider than the button. */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-6 pb-24 pt-8 lg:flex-row lg:items-center lg:justify-between 2xl:pb-8">
          <div className="space-y-1 text-xs text-slate-300/80 xl:w-[var(--footer-lead)]">
            <p>© {new Date().getFullYear()} Platforma eMIP. Toate drepturile rezervate.</p>
            <p>Denumirea eMIP și logo-ul eMIP sunt mărci înregistrate ® ale EMIP SRL, sub licență OSIM.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {legalNav.map((item) => (
              <Link key={item.href} to={item.href} className={`text-xs ${linkClass}`}>
                {item.label}
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  );
}
