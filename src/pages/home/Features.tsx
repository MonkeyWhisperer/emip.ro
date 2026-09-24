import { features } from "../../content/home";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { IconCard } from "../../components/ui/IconCard";
import { Section, SectionHeader } from "../../components/ui/Section";

export function Features() {
  return (
    <Section id="functionalitati">
      <SectionHeader eyebrow={features.eyebrow} title={features.title} text={features.text} />

      {/* The same cards as the Benefits section. */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.items.map((item) => (
          <IconCard key={item.title} {...item} layout="title-row" compact />
        ))}
      </div>

      <div className="mt-14 text-center">
        <ButtonLink href={features.more.href} variant="outline" arrow>
          {features.more.label}
        </ButtonLink>
      </div>
    </Section>
  );
}
