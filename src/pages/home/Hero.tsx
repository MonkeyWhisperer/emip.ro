import { hero } from "../../content/home";
import { useCountUp } from "../../hooks/useCountUp";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { Container } from "../../components/ui/Section";
import heroImage from "../../assets/hero.webp";

function Stat({ value, suffix, label }: (typeof hero.stats)[number]) {
  const { ref, value: current } = useCountUp<HTMLDivElement>(value);
  return (
    <div ref={ref} className="px-6 py-5 text-center sm:text-left">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-4xl font-bold tabular-nums text-white" aria-hidden>
          {current}
          {suffix}
        </span>
        <span className="sr-only">
          {value}
          {suffix}
        </span>
        <span className="mt-1 block text-sm text-slate-300" aria-hidden>
          {label}
        </span>
      </dd>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      <img
        src={heroImage}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 -z-20 size-full object-cover object-[70%_center]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/90 to-navy-950/40 max-lg:via-navy-950/85 max-lg:to-navy-950/75" />

      <Container className="pb-16 pt-20 sm:pt-28 lg:pb-20">
        <div className="max-w-2xl animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-300">
            <span className="size-1.5 rounded-full bg-brand-400" aria-hidden />
            {hero.eyebrow}
          </p>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-6 text-xl font-semibold text-brand-300">{hero.subtitle}</p>
          <p className="mt-4 text-lg leading-relaxed text-slate-200">{hero.text}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-start">
            {/* The note belongs to the demo button, so it sits directly under it. */}
            <div className="flex flex-col gap-2">
              <ButtonLink href={hero.primary.href} arrow>
                {hero.primary.label}
              </ButtonLink>
              <p className="text-center text-xs text-slate-300">
                {hero.primaryNote}
              </p>
            </div>
            <ButtonLink href={hero.secondary.href} variant="outline-light">
              {hero.secondary.label}
            </ButtonLink>
          </div>
        </div>

        <dl className="mt-16 grid max-w-3xl divide-white/10 rounded-2xl border border-white/10 bg-navy-950/60 backdrop-blur-sm max-sm:divide-y sm:grid-cols-3 sm:divide-x">
          {hero.stats.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </dl>
      </Container>
    </section>
  );
}
