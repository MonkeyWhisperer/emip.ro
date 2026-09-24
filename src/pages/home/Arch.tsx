import { CircleCheck } from "lucide-react";
import { arch } from "../../content/home";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { IconCard } from "../../components/ui/IconCard";
import { Section } from "../../components/ui/Section";

export function Arch() {
  return (
    <Section id="emip-arch" tone="dark" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[32rem] rounded-full bg-brand-500/10 blur-3xl"
      />
      <div className="relative grid gap-14 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <div>
          <p className="inline-flex rounded-full bg-brand-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy-950">
            {arch.badge}
          </p>
          <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{arch.title}</h2>
          <p className="mt-3 text-xl font-semibold text-brand-300">{arch.subtitle}</p>
          <p className="mt-6 leading-relaxed text-slate-300">{arch.text}</p>
          <ul className="mt-8 space-y-3">
            {arch.highlights.map((h) => (
              <li key={h} className="flex gap-3 text-white">
                <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-400" />
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-start">
            {/* The note belongs to the demo button, so it sits directly under it (as in the hero). */}
            <div className="flex flex-col gap-2">
              <ButtonLink href={arch.primary.href} arrow>
                {arch.primary.label}
              </ButtonLink>
              <p className="text-center text-xs text-slate-300">{arch.primaryNote}</p>
            </div>
            <ButtonLink href={arch.secondary.href} variant="outline-light">
              {arch.secondary.label}
            </ButtonLink>
          </div>
        </div>

        {/* Two columns from md: narrower cards would wrap "Arhivare Electronică Acreditată". */}
        <div className="grid gap-5 md:grid-cols-2">
          {arch.items.map((item) => (
            <IconCard key={item.title} {...item} dark layout="title-row" compact />
          ))}
        </div>
      </div>
    </Section>
  );
}
