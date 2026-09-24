import { Info } from "lucide-react";
import { howItWorks } from "../../content/home";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { Section, SectionHeader } from "../../components/ui/Section";

export function HowItWorks() {
  return (
    <Section id="cum-functioneaza" tone="muted">
      <SectionHeader eyebrow={howItWorks.eyebrow} title={howItWorks.title} text={howItWorks.text} />

      <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {howItWorks.steps.map((step, i) => (
          <li
            key={step.title}
            className="relative lg:not-last:after:absolute lg:not-last:after:top-6 lg:not-last:after:-right-4 lg:not-last:after:left-14 lg:not-last:after:h-px lg:not-last:after:bg-navy-200"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-navy-950 text-lg font-bold text-brand-400">
              {i + 1}
            </span>
            <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 leading-relaxed text-slate-600">{step.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-14 flex flex-col items-center gap-5 text-center">
        <ButtonLink href={howItWorks.cta.href} variant="dark" arrow>
          {howItWorks.cta.label}
        </ButtonLink>
        <p className="flex max-w-xl gap-2 text-left text-sm text-slate-500">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          {howItWorks.note}
        </p>
      </div>
    </Section>
  );
}
