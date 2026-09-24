import { purpose } from "../../content/despre";
import { Section } from "../../components/ui/Section";
import purposeImage from "../../assets/despre/despre-hero.webp";

/** Mission and vision, next to the illustration from the live page's hero. */
export function Purpose() {
  return (
    <Section id="misiune-si-viziune">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          {purpose.items.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="flex flex-col gap-5 rounded-2xl border border-slate-200 p-6 sm:flex-row sm:p-8"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-brand-400">
                <Icon aria-hidden className="size-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                <p className="mt-3 text-lg leading-relaxed text-slate-600">{text}</p>
              </div>
            </article>
          ))}
        </div>

        <img
          src={purposeImage}
          alt={purpose.imageAlt}
          width={1400}
          height={781}
          className="w-full rounded-3xl shadow-2xl shadow-navy-900/15"
        />
      </div>
    </Section>
  );
}
