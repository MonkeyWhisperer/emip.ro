import { header, meta, personas } from "../../content/solutii";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Comparison } from "./Comparison";
import { PersonaSection } from "./PersonaSection";
import { ProductIntro } from "./ProductIntro";
import { SolutiiCta } from "./SolutiiCta";

export function SolutiiPage() {
  return (
    <>
      <PageMeta title={meta.title} description={meta.description} />
      <PageHeader eyebrow={header.eyebrow} title={header.title} text={header.text}>
        <nav aria-label={header.navLabel}>
          <ul className="flex flex-wrap gap-2">
            {personas.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-brand-400/60 hover:bg-white/10"
                >
                  <Icon aria-hidden className="size-4 shrink-0 text-brand-400" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <ProductIntro />

      {personas.map((persona, i) => (
        <PersonaSection
          key={persona.id}
          persona={persona}
          tone={i % 2 === 0 ? "muted" : "white"}
          imageRight={i % 2 === 1}
        />
      ))}

      <Comparison />
      <SolutiiCta />
    </>
  );
}
