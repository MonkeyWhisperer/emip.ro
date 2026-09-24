import { cta } from "../../content/despre";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { Section, SectionHeader } from "../../components/ui/Section";

export function Cta() {
  return (
    <Section id="hai-sa-lucram-impreuna">
      <SectionHeader eyebrow={cta.eyebrow} title={cta.title} text={cta.text} />
      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href={cta.primary.href} variant="dark" arrow>
          {cta.primary.label}
        </ButtonLink>
        <ButtonLink href={cta.secondary.href} variant="outline">
          {cta.secondary.label}
        </ButtonLink>
      </div>
    </Section>
  );
}
