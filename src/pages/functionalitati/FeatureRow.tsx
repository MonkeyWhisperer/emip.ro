import { CircleCheck, type LucideIcon } from "lucide-react";
import type { Feature } from "../../content/functionalitati";
import { Section } from "../../components/ui/Section";

type Props = { feature: Feature; index: number; total: number };

/** One feature: text and checklist on one side, illustration on the other, alternating per row. */
export function FeatureRow({ feature, index, total }: Props) {
  const { id, icon: Icon, title, text, items, image, orbit } = feature;
  const flipped = index % 2 === 1;
  const headingId = `${id}-titlu`;

  return (
    <Section id={id} tone={flipped ? "muted" : "white"}>
      <article aria-labelledby={headingId} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={flipped ? "lg:order-2" : ""}>
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-navy-900 text-brand-400">
              <Icon aria-hidden className="size-6" />
            </span>
            <span aria-hidden className="text-sm font-bold tabular-nums tracking-wider text-slate-500">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
          {/* Focus target for the "Cuprins" links on the page header. */}
          <h2 id={headingId} tabIndex={-1} className="mt-6 text-3xl font-bold tracking-tight focus:outline-none sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">{text}</p>
          <ul className="mt-8 space-y-4">
            {items.map((item) => (
              <li key={item} className="flex gap-3 leading-relaxed">
                <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {image ? (
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full rounded-3xl object-cover shadow-xl shadow-navy-900/15 ring-1 ring-navy-900/10"
          />
        ) : (
          <IconPanel icon={Icon} orbit={orbit} />
        )}
      </article>
    </Section>
  );
}

// Corners of a square inscribed in the outer ring (radius 160px), i.e. the ring at 45° steps.
const orbitSpots = [
  "-translate-x-[113px] -translate-y-[113px]",
  "translate-x-[113px] -translate-y-[113px]",
  "-translate-x-[113px] translate-y-[113px]",
  "translate-x-[113px] translate-y-[113px]",
];

/** Decorative stand-in for the illustration; hidden on phones, where the heading icon is enough. */
function IconPanel({ icon: Icon, orbit = [] }: { icon: LucideIcon; orbit?: LucideIcon[] }) {
  return (
    <div
      aria-hidden
      className="relative isolate flex aspect-[16/10] items-center justify-center overflow-hidden rounded-3xl bg-navy-950 shadow-xl shadow-navy-900/15 max-lg:hidden"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle,rgb(255_255_255/0.09)_1px,transparent_1px)] bg-size-[22px_22px]" />
      <div className="absolute -right-24 -top-24 -z-10 size-96 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 -z-10 size-96 rounded-full bg-navy-600/40 blur-3xl" />
      <div className="absolute size-80 rounded-full border border-white/10" />
      <div className="absolute size-52 rounded-full border border-white/5" />
      <div className="flex size-28 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-300 to-brand-500 text-navy-950 shadow-2xl shadow-brand-500/30">
        <Icon className="size-14" strokeWidth={1.5} />
      </div>
      {orbit.map((OrbitIcon, i) => (
        <div
          key={i}
          className={`absolute flex size-12 items-center justify-center rounded-xl border border-white/15 bg-navy-900/80 text-brand-300 shadow-lg shadow-black/20 backdrop-blur-sm ${orbitSpots[i]}`}
        >
          <OrbitIcon className="size-5" />
        </div>
      ))}
    </div>
  );
}
