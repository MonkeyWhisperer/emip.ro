import { hero, type HeroStat } from "../../content/home";
import { useCountUp } from "../../hooks/useCountUp";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { Container } from "../../components/ui/Section";
import heroImage from "../../assets/hero.webp";

function Stat({ value, prefix, suffix, label, countUp }: HeroStat) {
  const { ref, value: current } = useCountUp<HTMLDivElement>(value);
  return (
    // Each cell draws its top and left border; the <dl>'s -m-px hides those on the outer edges.
    <div ref={ref} className="border-l border-t border-white/10 px-6 py-5 text-center sm:text-left sm:max-lg:last:col-span-2">
      <dt className="sr-only">{label}</dt>
      <dd>
        {/* 30px between lg and xl, where five columns leave "Din 2018" too little room at 36px. */}
        <span className="block text-4xl font-bold tabular-nums text-white lg:max-xl:text-3xl" aria-hidden>
          {prefix}
          {countUp === false ? value : current}
          {suffix}
        </span>
        <span className="sr-only">
          {prefix}
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
      {/* The image is dark on the left, where the text sits. From xl the network has room beside the
          text and is only lightly dimmed; on narrower screens it runs behind the text, so more. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/60 via-45% to-transparent max-xl:via-navy-950/85 max-xl:to-navy-950/60 max-lg:to-navy-950/75" />

      <Container className="pb-16 pt-20 sm:pt-28 lg:pb-20">
        {/* max-w-4xl for the heading ("livrate la timp și în" on one line at 60px); the text stays max-w-2xl. */}
        <div className="max-w-4xl animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-300">
            <span className="size-1.5 rounded-full bg-brand-400" aria-hidden />
            {hero.eyebrow}
          </p>
          {/* The spaces keep the parts apart in the page's text (search engines, the AI export). */}
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-wider text-white sm:text-5xl lg:text-6xl">
            <span className="block">{hero.title.lead}</span>{" "}
            <span className="text-brand-400">{hero.title.accent}</span> {hero.title.tail[0]}
            <br className="max-md:hidden" /> {hero.title.tail[1]}
          </h1>
          <p className="mt-6 max-w-2xl text-xl font-semibold text-brand-300">{hero.subtitle}</p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-200">{hero.text}</p>
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

        {/* One row of five from lg; two columns below that, the last stat spanning both. */}
        <div className="mt-16 max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-navy-950/60 backdrop-blur-sm lg:max-w-none">
          <dl className="-m-px grid sm:grid-cols-2 lg:grid-cols-5">
            {hero.stats.map((stat) => (
              <Stat key={stat.label} {...stat} />
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
