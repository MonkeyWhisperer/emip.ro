import { finalCta } from "../../content/home";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { Container } from "../../components/ui/Section";

export function FinalCta() {
  return (
    <section className="bg-white pb-20 sm:pb-24">
      <Container>
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 px-6 py-14 sm:px-12 lg:px-16">
          <div
            aria-hidden
            className="absolute -bottom-32 -right-20 -z-10 size-96 rounded-full bg-brand-400/20 blur-3xl"
          />
          <div className="grid items-center gap-10 lg:grid-cols-[3fr_2fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{finalCta.title}</h2>
              <p className="mt-4 text-lg text-slate-200">{finalCta.text}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={finalCta.primary.href} arrow>
                  {finalCta.primary.label}
                </ButtonLink>
                <ButtonLink href={finalCta.secondary.href} variant="outline-light">
                  {finalCta.secondary.label}
                </ButtonLink>
              </div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {finalCta.perks.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 font-medium text-white">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon aria-hidden className="size-4 text-brand-400" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
