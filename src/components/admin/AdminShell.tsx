import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigation } from "react-router";
import { BotMessageSquare, ExternalLink, FileText, Inbox, LogOut, Menu, Tags, UserRound, X, type LucideIcon } from "lucide-react";
import logo from "../../assets/logo.png";

type NavItem = { href: string; label: string; icon: LucideIcon; active: (path: string) => boolean };

const nav: NavItem[] = [
  {
    href: "/admin",
    label: "Articole",
    icon: FileText,
    active: (p) => p === "/admin" || p === "/admin/" || p.startsWith("/admin/posts"),
  },
  { href: "/admin/categories", label: "Categorii", icon: Tags, active: (p) => p.startsWith("/admin/categories") },
  { href: "/admin/messages", label: "Mesaje", icon: Inbox, active: (p) => p.startsWith("/admin/messages") },
  { href: "/admin/ai", label: "Asistent AI", icon: BotMessageSquare, active: (p) => p.startsWith("/admin/ai") },
];

type Props = {
  email: string;
  unread: number | null;
  onSignOut: () => void;
  signingOut: boolean;
  children: ReactNode;
};

function Brand() {
  return (
    <Link to="/admin" className="flex items-center gap-2.5 rounded-lg" aria-label="Administrare eMIP, lista de articole">
      <img src={logo} alt="" width={32} height={32} className="size-8" />
      <span className="text-lg font-bold tracking-tight text-white">
        eMIP<sup className="ml-0.5 text-[0.55em] font-medium text-brand-400">®</sup>
      </span>
      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-300">
        Admin
      </span>
    </Link>
  );
}

function NavLinks({ unread }: { unread: number | null }) {
  const { pathname } = useLocation();
  return (
    <ul className="space-y-1">
      {nav.map(({ href, label, icon: Icon, active }) => {
        const isActive = active(pathname);
        return (
          <li key={href}>
            <NavLink
              to={href}
              end
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon aria-hidden className={`size-4.5 shrink-0 ${isActive ? "text-brand-400" : "text-slate-400 group-hover:text-slate-200"}`} />
              <span className="flex-1">{label}</span>
              {href === "/admin/messages" && unread ? (
                <span className="rounded-full bg-brand-400 px-2 py-0.5 text-xs font-bold text-navy-950">
                  {unread}
                  <span className="sr-only"> {unread === 1 ? "mesaj necitit" : "mesaje necitite"}</span>
                </span>
              ) : null}
            </NavLink>
          </li>
        );
      })}
      <li className="!mt-4 border-t border-white/10 pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink aria-hidden className="size-4.5 shrink-0 text-slate-400 group-hover:text-slate-200" />
          <span className="flex-1">Vezi site-ul</span>
          <span className="sr-only">(se deschide într-o filă nouă)</span>
        </a>
      </li>
    </ul>
  );
}

function Account({ email, onSignOut, signingOut }: Pick<Props, "email" | "onSignOut" | "signingOut">) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="flex items-center gap-2.5 text-sm text-slate-300">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-brand-300">
          <UserRound aria-hidden className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-slate-400">Conectat ca</span>
          <span className="block truncate font-medium text-white" title={email}>
            {email}
          </span>
        </span>
      </p>
      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white disabled:opacity-60"
      >
        <LogOut aria-hidden className="size-4" />
        {signingOut ? "Se deconectează…" : "Deconectare"}
      </button>
    </div>
  );
}

/** Admin chrome: sidebar on wide screens, collapsible top bar on phones. */
export function AdminShell({ email, unread, onSignOut, signingOut, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  const navigating = useNavigation().state === "loading";

  useEffect(() => setMenuOpen(false), [pathname]);

  // Escape closes the phone menu and returns focus to its button.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("dialog[open]")) return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    // tabular-nums + a little extra word spacing: equal-width digits line up in lists, and the
    // font's narrow "1" and space no longer make counts like "1 întrebare" read as one word.
    <div className="min-h-screen bg-slate-100 tabular-nums [word-spacing:0.08em] lg:pl-64">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-navy-950"
      >
        Sari la conținut
      </a>
      <div
        aria-hidden
        className={`fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-brand-400 transition-transform duration-700 ease-out ${
          navigating ? "scale-x-75" : "scale-x-0"
        }`}
      />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-8 overflow-y-auto bg-navy-950 px-4 py-6 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav aria-label="Administrare" className="flex-1">
          <NavLinks unread={unread} />
        </nav>
        <Account email={email} onSignOut={onSignOut} signingOut={signingOut} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 bg-navy-950 lg:hidden">
        <div className="flex h-14 items-center justify-between gap-4 px-4">
          <Brand />
          <button
            ref={menuButton}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-nav"
            className="relative -mr-2 rounded-lg p-2 text-white"
          >
            <span className="sr-only">{menuOpen ? "Închide meniul" : "Deschide meniul"}</span>
            {menuOpen ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
            {!menuOpen && unread ? (
              <span aria-hidden className="absolute right-1 top-1 size-2.5 rounded-full bg-brand-400 ring-2 ring-navy-950" />
            ) : null}
          </button>
        </div>
        {menuOpen && (
          <div id="admin-mobile-nav" className="border-t border-white/10 px-4 pb-5 pt-3">
            <nav aria-label="Administrare">
              <NavLinks unread={unread} />
            </nav>
            <div className="mt-4">
              <Account email={email} onSignOut={onSignOut} signingOut={signingOut} />
            </div>
          </div>
        )}
      </header>

      <main id="admin-main" tabIndex={-1} className="px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
