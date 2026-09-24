import { purpose } from "../../content/despre";
import { Section } from "../../components/ui/Section";

/** Mission and vision, side by side from md. */
export function Purpose() {
  return (
    <Section id="misiune-si-viziune">
      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        {purpose.items.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-brand-400">
                <Icon aria-hidden className="size-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            </div>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
