import { association } from "../../content/despre";
import { useCountUp } from "../../hooks/useCountUp";
import { Section, SectionHeader } from "../../components/ui/Section";
import associationImage from "../../assets/despre/asociatia-emip.webp";

function Stat({ value, suffix, label }: (typeof association.stats)[number]) {
  const { ref, value: current } = useCountUp<HTMLDivElement>(value);
  return (
    <div ref={ref} className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-4xl font-extrabold tabular-nums tracking-tight text-brand-400" aria-hidden>
          {current}
          {suffix}
        </span>
        <span className="sr-only">
          {value}
          {suffix}
        </span>
        <span className="mt-1 block text-sm font-medium text-slate-300" aria-hidden>
          {label}
        </span>
      </dd>
    </div>
  );
}

export function Association() {
  const [lead, ...rest] = association.paragraphs;

  return (
    <Section id="asociatia-emip" tone="dark" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -bottom-40 size-[32rem] rounded-full bg-brand-500/10 blur-3xl"
      />
      <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeader eyebrow={association.eyebrow} title={association.title} text={lead} dark align="left" />
          {rest.map((p) => (
            <p key={p} className="mt-4 text-lg leading-relaxed text-slate-300">
              {p}
            </p>
          ))}
          <dl className="mt-10 grid max-w-md grid-cols-2 gap-4">
            {association.stats.map((stat) => (
              <Stat key={stat.label} {...stat} />
            ))}
          </dl>
        </div>

        <img
          src={associationImage}
          alt={association.imageAlt}
          width={1400}
          height={781}
          loading="lazy"
          className="w-full rounded-3xl ring-1 ring-white/10"
        />
      </div>
    </Section>
  );
}
