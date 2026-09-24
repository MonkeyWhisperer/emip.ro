import { benefits } from "../../content/home";
import { IconCard } from "../../components/ui/IconCard";
import { Section, SectionHeader } from "../../components/ui/Section";

export function Benefits() {
  return (
    <Section id="beneficii">
      <SectionHeader eyebrow={benefits.eyebrow} title={benefits.title} text={benefits.text} />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.items.map((item) => (
          <IconCard key={item.title} {...item} layout="inline" />
        ))}
      </div>
    </Section>
  );
}
