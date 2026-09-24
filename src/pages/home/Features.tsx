import { features } from "../../content/home";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { Section, SectionHeader } from "../../components/ui/Section";

export function Features() {
  return (
    <Section id="functionalitati">
      <SectionHeader eyebrow={features.eyebrow} title={features.title} text={features.text} />

      <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {features.items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-brand-400">
              <Icon aria-hidden className="size-5" />
            </div>
            {/* pt-2.5 centres the title's first line on the icon. */}
            <div className="min-w-0 pt-2.5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          </div>
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
