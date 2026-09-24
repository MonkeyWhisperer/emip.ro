import { useCases } from "../../content/home";
import { IconCard } from "../../components/ui/IconCard";
import { Section, SectionHeader } from "../../components/ui/Section";

export function UseCases() {
  return (
    <Section id="cazuri-de-utilizare">
      <SectionHeader eyebrow={useCases.eyebrow} title={useCases.title} text={useCases.text} />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {useCases.items.map(({ tags, ...item }) => (
          <IconCard key={item.title} {...item}>
            <ul className="mt-auto flex flex-wrap gap-2 pt-5">
              {tags.map((tag) => (
                <li key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {tag}
                </li>
              ))}
            </ul>
          </IconCard>
        ))}
      </div>
    </Section>
  );
}
