import { CircleCheck, CircleX } from "lucide-react";
import { comparison } from "../../content/solutii";
import { Section, SectionHeader } from "../../components/ui/Section";

export function Comparison() {
  return (
    <Section id="comparatie" tone="muted">
      <SectionHeader eyebrow={comparison.eyebrow} title={comparison.title} text={comparison.text} />

      <ul className="mt-14 grid gap-6 lg:grid-cols-3">
        {comparison.items.map(({ icon: Icon, title, problems, solution }) => (
          <li
            key={title}
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg hover:shadow-navy-900/5"
          >
            <div className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon aria-hidden className="size-5" />
                </span>
                <h3 className="text-xl font-bold tracking-tight">{title}</h3>
              </div>

              <h4 className="mt-6 text-sm font-semibold uppercase tracking-wider text-slate-500">
                {comparison.problemsLabel}
              </h4>
              <ul className="mt-3 space-y-2.5">
                {problems.map((problem) => (
                  <li key={problem} className="flex gap-3 leading-relaxed text-slate-700">
                    <CircleX aria-hidden className="mt-1 size-4 shrink-0 text-rose-500" />
                    {problem}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto bg-navy-950 p-6">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-400">
                <CircleCheck aria-hidden className="size-4 shrink-0" />
                {comparison.solutionLabel}
              </h4>
              <p className="mt-3 leading-relaxed text-white">{solution}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
