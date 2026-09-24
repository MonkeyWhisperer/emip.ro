import { useCases } from "../../content/home";
import { IconCard } from "../../components/ui/IconCard";
import { Section, SectionHeader } from "../../components/ui/Section";

export function UseCases() {
  return (
    <Section id="cazuri-de-utilizare">
      <SectionHeader eyebrow={useCases.eyebrow} title={useCases.title} text={useCases.text} />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {useCases.items.map((item) => (
          <IconCard key={item.title} {...item} layout="title-row" />
        ))}
      </div>
    </Section>
  );
}
