import { finalCta } from "../../content/solutii";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { DemoButton } from "../../components/ui/DemoButton";
import { Container } from "../../components/ui/Section";

export function SolutiiCta() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 px-6 py-14 text-center sm:px-12 lg:py-16">
          <div
            aria-hidden
            className="absolute -bottom-32 -right-20 -z-10 size-96 rounded-full bg-brand-400/20 blur-3xl"
          />
          <div aria-hidden className="absolute -left-24 -top-32 -z-10 size-80 rounded-full bg-navy-600/40 blur-3xl" />
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {finalCta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-200">{finalCta.text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-start">
            <DemoButton href={finalCta.primary.href} arrow>
              {finalCta.primary.label}
            </DemoButton>
            <ButtonLink href={finalCta.secondary.href} variant="outline-light">
              {finalCta.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
