import { Quote } from "lucide-react";
import { fundedProjects } from "../../content/home";
import { Section, SectionHeader } from "../../components/ui/Section";

export function FundedProjects() {
  return (
    <Section id="proiecte-finantate">
      <SectionHeader eyebrow={fundedProjects.eyebrow} title={fundedProjects.title} text={fundedProjects.text} />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {fundedProjects.metrics.map((m) => (
          <div key={m.title} className="rounded-2xl border border-slate-200 p-6">
            <p className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-brand-700">{m.metric}</span>
              <span className="text-sm font-semibold text-slate-500">{m.metricLabel}</span>
            </p>
            <h3 className="mt-4 text-lg font-semibold">{m.title}</h3>
            <p className="mt-2 leading-relaxed text-slate-600">{m.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-slate-50 p-6 sm:p-10 lg:p-12">
        <h3 className="max-w-2xl text-2xl font-bold tracking-tight">{fundedProjects.reasonsTitle}</h3>
        <div className="mt-10 grid gap-10 lg:grid-cols-[3fr_2fr]">
          <ul className="space-y-8">
            {fundedProjects.reasons.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                  <Icon aria-hidden className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold">{title}</h4>
                  <p className="mt-1 leading-relaxed text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <figure className="flex flex-col justify-center rounded-2xl bg-navy-950 p-8 text-white">
            <Quote aria-hidden className="size-8 text-brand-400" />
            <blockquote className="mt-4 text-lg leading-relaxed">{fundedProjects.testimonial}</blockquote>
          </figure>
        </div>
      </div>
    </Section>
  );
}
