import { values } from "../../content/despre";
import { IconCard } from "../../components/ui/IconCard";
import { Section, SectionHeader } from "../../components/ui/Section";

export function Values() {
  return (
    <Section id="valori" tone="muted">
      <SectionHeader eyebrow={values.eyebrow} title={values.title} />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {values.items.map((item) => (
          <IconCard key={item.title} {...item} layout="title-row" compact />
        ))}
      </div>
    </Section>
  );
}
