import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { APP_URL, mainNav } from "../../content/site";
import { ButtonLink } from "../ui/ButtonLink";
import { Container } from "../ui/Section";
import { Logo } from "../ui/Logo";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "text-brand-400" : "text-slate-200 hover:text-white"
  }`;

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Navigare principală" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <NavLink to={item.href} className={navLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={APP_URL} className="px-3 py-2 text-sm font-semibold text-white hover:text-brand-300">
            Log in
          </a>
          <ButtonLink href={APP_URL} className="!px-5 !py-2.5">
            Demo interactiv
          </ButtonLink>
        </div>

        <button
          type="button"
          className="-mr-2 rounded-md p-2 text-white lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Închide meniul" : "Deschide meniul"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </Container>

      {open && (
        <nav id="mobile-menu" aria-label="Navigare principală" className="border-t border-white/10 lg:hidden">
          <Container className="py-4">
            <ul className="flex flex-col">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <NavLink to={item.href} className={(s) => `block ${navLinkClass(s)} py-3 text-base`}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ButtonLink href={APP_URL} variant="outline-light">
                Log in
              </ButtonLink>
              <ButtonLink href={APP_URL}>Demo interactiv</ButtonLink>
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}
