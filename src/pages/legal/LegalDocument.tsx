import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { CalendarDays, ChevronDown, FileText, Info, Landmark, TableOfContents, type LucideIcon } from "lucide-react";
import { legalCta, legalDocs, legalLabels, type LegalDoc } from "../../content/legal/legal";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { DemoButton } from "../../components/ui/DemoButton";
import { Markdown } from "../../components/ui/Markdown";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Container, Section } from "../../components/ui/Section";

type Chapter = { id: string; title: string; body: string };

const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Splits a legal Markdown text into intro, `## ` chapters and the closing note after `***`. */
function splitDocument(source: string) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = lines.lastIndexOf("***");
  const intro: string[] = [];
  const chapters: (Omit<Chapter, "body"> & { lines: string[] })[] = [];
  const used = new Set<string>();

  for (const line of end >= 0 ? lines.slice(0, end) : lines) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      const title = heading[1].trim();
      let id = slugify(title);
      for (let n = 2; used.has(id); n++) id = `${slugify(title)}-${n}`;
      used.add(id);
      chapters.push({ id, title, lines: [] });
    } else {
      (chapters.at(-1)?.lines ?? intro).push(line);
    }
  }

  return {
    intro: intro.join("\n").trim(),
    chapters: chapters.map(({ lines, ...c }): Chapter => ({ ...c, body: lines.join("\n").trim() })),
    outro: end >= 0 ? lines.slice(end + 1).join("\n").trim() : "",
  };
}

/** Below the sticky header and the anchor scroll offset (html scroll-padding + section scroll margin). */
const ACTIVE_OFFSET = 128;

/** Id of the chapter the reader is currently in, for highlighting the table of contents. */
function useActiveChapter(ids: string[]) {
  const [active, setActive] = useState<string>();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | undefined;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el || el.getBoundingClientRect().top > ACTIVE_OFFSET) break;
        current = id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids]);

  return active;
}

/**
 * Deep links (#chapter) are scrolled to by the router before the web font has loaded;
 * the long text then reflows and the target drifts away, so scroll again once fonts are ready.
 */
function useHashCorrection(ids: string[]) {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!ids.includes(id) || !document.fonts) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);
}

function DocumentSwitcher({ current }: { current: LegalDoc }) {
  return (
    <nav aria-labelledby="legal-docs-label">
      <p id="legal-docs-label" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {legalLabels.documents}
      </p>
      <ul className="mt-3 space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
        {legalDocs.map(({ href, label, icon: Icon }) => {
          const isCurrent = href === current.href;
          return (
            <li key={href}>
              <Link
                to={href}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-white text-navy-950 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-white/70 hover:text-navy-950"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    isCurrent ? "bg-navy-950 text-brand-400" : "bg-white text-slate-500 ring-1 ring-slate-200"
                  }`}
                >
                  <Icon aria-hidden className="size-4" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TocList({ chapters, active }: { chapters: Chapter[]; active?: string }) {
  return (
    <ol className="space-y-0.5 border-l border-slate-200">
      {chapters.map(({ id, title }) => {
        const isActive = id === active;
        return (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={isActive ? "location" : undefined}
              className={`-ml-px block border-l-2 py-1.5 pl-4 pr-2 text-[13px] leading-snug transition-colors ${
                isActive
                  ? "border-brand-600 font-semibold text-navy-950"
                  : "border-transparent text-slate-600 hover:border-slate-400 hover:text-navy-950"
              }`}
            >
              {title}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

type Props = { doc: LegalDoc; source: string };

/** Shared layout of the legal pages: header, document switcher, table of contents and the text. */
export function LegalDocument({ doc, source }: Props) {
  const { intro, chapters, outro } = useMemo(() => splitDocument(source), [source]);
  const ids = useMemo(() => chapters.map((c) => c.id), [chapters]);
  const active = useActiveChapter(ids);
  useHashCorrection(ids);

  const facts: { icon: LucideIcon; label?: string; value: string }[] = [
    { icon: CalendarDays, label: legalLabels.updated, value: doc.updated },
    { icon: FileText, label: legalLabels.version, value: doc.version },
    ...(doc.compliance ? [{ icon: Landmark, value: doc.compliance }] : []),
  ];

  return (
    <>
      <PageMeta title={doc.meta.title} description={doc.meta.description} />
      <PageHeader eyebrow={legalLabels.eyebrow} title={doc.title} text={doc.text}>
        <ul className="flex flex-wrap gap-2" aria-label={legalLabels.facts}>
          {facts.map(({ icon: Icon, label, value }) => (
            <li
              key={value}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white"
            >
              <Icon aria-hidden className="size-4 shrink-0 text-brand-400" />
              {label && <span className="text-slate-300">{label}:</span>}
              {value}
            </li>
          ))}
        </ul>
      </PageHeader>

      <div className="bg-white">
        <Container className="py-12 sm:py-16 lg:grid lg:grid-cols-[15rem_minmax(0,48rem)] lg:justify-center lg:gap-12 xl:gap-20">
          {/* -mx-1/px-1: the scroll box clips overflow, so give the links' focus rings room at the sides. */}
          <aside className="lg:sticky lg:top-24 lg:-mx-1 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:px-1 lg:pb-4">
            <DocumentSwitcher current={doc} />

            {chapters.length > 1 && (
              <>
                <nav aria-label={legalLabels.toc} className="mt-4 lg:hidden">
                  <details className="group rounded-2xl border border-slate-200">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-navy-950 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-2">
                        <TableOfContents aria-hidden className="size-4 text-brand-700" />
                        {legalLabels.toc}
                      </span>
                      <ChevronDown aria-hidden className="size-4 text-slate-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4">
                      <TocList chapters={chapters} active={active} />
                    </div>
                  </details>
                </nav>

                <nav aria-labelledby="legal-toc-label" className="mt-10 hidden lg:block">
                  <p
                    id="legal-toc-label"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    <TableOfContents aria-hidden className="size-4" />
                    {legalLabels.toc}
                  </p>
                  <div className="mt-3">
                    <TocList chapters={chapters} active={active} />
                  </div>
                </nav>
              </>
            )}
          </aside>

          <article className="mt-10 min-w-0 lg:mt-0">
            {doc.notice && (
              <div className="mb-10 flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
                <Markdown source={doc.notice} className="prose-sm min-w-0" />
              </div>
            )}

            {intro && <Markdown source={intro} />}

            {chapters.map((chapter, i) => (
              <section
                key={chapter.id}
                id={chapter.id}
                aria-labelledby={`${chapter.id}-title`}
                className={`scroll-mt-6 ${i > 0 || intro ? "mt-12 border-t border-slate-200 pt-10" : ""}`}
              >
                <h2 id={`${chapter.id}-title`} className="text-xl font-bold tracking-tight sm:text-2xl">
                  {chapter.title}
                </h2>
                {chapter.body && <Markdown source={chapter.body} className="mt-6" />}
              </section>
            ))}

            {outro && (
              <footer className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 text-center">
                <Markdown source={outro} className="prose-sm" />
              </footer>
            )}
          </article>
        </Container>
      </div>

      <Section tone="muted">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{legalCta.title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">{legalCta.text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-start">
            <DemoButton href={legalCta.primary.href} variant="dark" arrow>
              {legalCta.primary.label}
            </DemoButton>
            <ButtonLink href={legalCta.secondary.href} variant="outline">
              {legalCta.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
