import { CircleAlert, CircleCheck } from "lucide-react";
import { personaLabels, type Persona } from "../../content/solutii";
import { Section } from "../../components/ui/Section";

type Props = {
  persona: Persona;
  tone: "white" | "muted";
  /** Alternates the illustration side on large screens. */
  imageRight: boolean;
};

export function PersonaSection({ persona, tone, imageRight }: Props) {
  const { id, icon: Icon, badge, title, text, challenges, solutions, image } = persona;

  return (
    <Section id={id} tone={tone}>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
        <div
          className={`relative overflow-hidden rounded-3xl bg-navy-900 shadow-xl shadow-navy-900/10 lg:min-h-[28rem] ${
            imageRight ? "lg:order-last" : ""
          }`}
        >
          <img
            src={image.src}
            alt={image.alt}
            width={1600}
            height={893}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover lg:absolute lg:inset-0 lg:aspect-auto lg:h-full"
          />
        </div>

        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-navy-950 px-3.5 py-1.5 text-xs font-semibold text-white sm:text-sm">
            <Icon aria-hidden className="size-4 shrink-0 text-brand-400" />
            {badge}
          </p>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">{text}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                {personaLabels.challenges}
              </h3>
              <ul className="mt-4 space-y-3">
                {challenges.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                    <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-navy-950 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-400">
                {personaLabels.solutions}
              </h3>
              <ul className="mt-4 space-y-3">
                {solutions.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-white">
                    <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
