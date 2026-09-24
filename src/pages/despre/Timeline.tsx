import { ArrowUpRight } from "lucide-react";
import { timeline } from "../../content/despre";
import { Section, SectionHeader } from "../../components/ui/Section";
import { SmartLink } from "../../components/ui/SmartLink";

/** Vertical timeline: a single rail on mobile, alternating sides from lg up. */
export function Timeline() {
  const lastIndex = timeline.items.length - 1;

  return (
    <Section id="evolutie">
      <SectionHeader eyebrow={timeline.eyebrow} title={timeline.title} />

      <ol className="relative mx-auto mt-14 flex max-w-5xl flex-col gap-6 before:absolute before:inset-y-2 before:left-3 before:w-0.5 before:-translate-x-1/2 before:rounded-full before:bg-navy-100 lg:gap-0 lg:before:left-1/2">
        {timeline.items.map(({ year, milestones }, i) => {
          const right = i % 2 === 1;
          const current = i === lastIndex;
          return (
            <li key={year} className="relative pl-10 lg:grid lg:grid-cols-2 lg:pl-0 lg:not-first:-mt-10">
              {/* The item is as tall as its card, so this centres the dot on the card. */}
              <span
                aria-hidden
                className={`absolute left-3 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white lg:left-1/2 ${
                  current ? "bg-navy-900" : "bg-brand-500"
                }`}
              />
              <div
                className={`rounded-2xl border p-6 ${
                  current ? "border-navy-900 bg-navy-950" : "border-slate-200 bg-white shadow-sm shadow-navy-900/5"
                } ${right ? "lg:col-start-2 lg:ml-10" : "lg:mr-10 lg:text-right"}`}
              >
                <h3
                  className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                    current ? "text-brand-400" : "text-brand-700"
                  }`}
                >
                  {year}
                </h3>
                <ul className={`mt-3 space-y-1.5 leading-relaxed ${current ? "text-slate-200" : "text-slate-600"}`}>
                  {milestones.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mx-auto mt-12 max-w-md text-balance text-center text-sm">
        <SmartLink
          href={timeline.footnote.href}
          className="font-medium text-navy-700 underline-offset-4 hover:underline"
        >
          {timeline.footnote.label}
          <ArrowUpRight aria-hidden className="ml-1 inline size-4 align-text-bottom" />
        </SmartLink>
      </p>
    </Section>
  );
}
