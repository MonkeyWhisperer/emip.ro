import { Link, useSearchParams } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { activeIssuers, certificationCount, intro, meta, type Certification, type Issuer } from "../../content/certificari";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Section } from "../../components/ui/Section";

const chipClass = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    active ? "bg-brand-400 text-navy-950" : "bg-white/10 text-slate-200 hover:bg-white/20"
  }`;

const newTab = <span className="sr-only"> (se deschide într-o filă nouă)</span>;

/** Code, name and the link to the certificate; area, number and dates stay in the data. */
function CertCard({ c }: { c: Certification }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-lg hover:shadow-navy-900/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold tracking-wide text-brand-700">{c.code}</p>
        {c.href && (
          // A plain link in a new tab: certificates are PDFs or pages on the issuers' sites.
          <a
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-navy-200 px-3 py-1 text-xs font-semibold text-navy-900 transition-colors hover:border-navy-600 hover:bg-navy-50"
          >
            {intro.view}
            <span className="sr-only">: {c.title}</span>
            <ArrowUpRight aria-hidden className="size-3.5" />
            {newTab}
          </a>
        )}
      </div>
      <h3 className="mt-3 font-semibold leading-snug">{c.title}</h3>
    </article>
  );
}

function IssuerSection({ issuer }: { issuer: Issuer }) {
  const headingId = `emitent-${issuer.id}`;
  return (
    <section aria-labelledby={headingId}>
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 id={headingId} className="text-2xl font-bold tracking-tight">
            {issuer.name}
          </h2>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-200 ring-inset">
            {intro.count(issuer.items.length)}
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{issuer.full}</p>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
          {typeof issuer.text === "function" ? issuer.text(issuer.items) : issuer.text}
        </p>
      </header>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Code plus issue date: two team members can hold the same certification (e.g. DP-300). */}
        {issuer.items.map((c) => (
          <li key={`${c.code}-${c.issued}`}>
            <CertCard c={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** /certificari: the team's certifications, by issuer, with numbers and verification links. */
export function CertificariPage() {
  const [params] = useSearchParams();
  const issuers = activeIssuers();
  const selected = issuers.find((i) => i.id === params.get("emitent"));
  const visible = selected ? [selected] : issuers;
  const total = certificationCount();

  return (
    <>
      <PageMeta title={meta.title} description={meta.description} />
      <PageHeader
        eyebrow={intro.eyebrow}
        title={intro.title}
        text={intro.text}
        wide={
          // Links, not buttons: a filtered view can be shared (e.g. /certificari?emitent=isaca in an offer).
          <nav aria-label={intro.filterLabel}>
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link to="/certificari" replace preventScrollReset aria-current={!selected ? "page" : undefined} className={chipClass(!selected)}>
                  {intro.all} <span className="opacity-75">{total}</span>
                </Link>
              </li>
              {issuers.map((i) => (
                <li key={i.id}>
                  <Link
                    to={`/certificari?emitent=${i.id}`}
                    replace
                    preventScrollReset
                    aria-current={selected?.id === i.id ? "page" : undefined}
                    className={chipClass(selected?.id === i.id)}
                  >
                    {i.name} <span className="opacity-75">{i.items.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        }
      />

      <Section tone="muted">
        <div className="space-y-16">
          {visible.map((issuer) => (
            <IssuerSection key={issuer.id} issuer={issuer} />
          ))}
        </div>
      </Section>
    </>
  );
}
