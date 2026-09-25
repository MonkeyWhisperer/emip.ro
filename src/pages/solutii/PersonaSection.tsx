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
        {/* As tall as the section on large screens. The 4:3 drawing has no background of its own:
            the box carries it (illustration-bg), so the drawing is shown whole in the middle of a
            box of any height instead of being cropped at the sides. */}
        <div
          className={`illustration-bg relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl shadow-navy-900/10 lg:aspect-auto lg:min-h-[28rem] ${
            imageRight ? "lg:order-last" : ""
          }`}
        >
          <img
            src={image.src}
            alt={image.alt}
            width={800}
            height={600}
            loading="lazy"
            className="absolute inset-0 size-full object-contain"
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
