import { CalendarX2 } from "lucide-react";
import { findService, servicePath } from "../../content/servicii";
import { workshopPage } from "../../content/workshop";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Section, SectionHeader } from "../../components/ui/Section";
import { ServiceFacts } from "../servicii/ServiceCard";

function EndedNotice() {
  const { ended, event } = workshopPage;
  return (
    <div className="rounded-2xl border border-brand-400/30 bg-white/5 p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-400 text-navy-950">
          <CalendarX2 aria-hidden className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-white">{ended.title}</h2>
          <p className="text-sm font-medium text-brand-300">
            {ended.dateText} <time dateTime={event.date}>{event.dateLabel}</time>
          </p>
        </div>
      </div>
      <p className="mt-4 leading-relaxed text-slate-300">{ended.text}</p>
      <ButtonLink href={ended.cta.href} arrow className="mt-6 w-full sm:w-auto">
        {ended.cta.label}
      </ButtonLink>
    </div>
  );
}

export function WorkshopPage() {
  const { meta, header, about, steps, finalCta } = workshopPage;
  const service = findService(about.serviceSlug);

  return (
    <>
      <PageMeta title={meta.title} description={meta.description} />
      {/* A past event: keep the old URL working but out of search results. */}
      <meta name="robots" content="noindex" />
      <PageHeader eyebrow={header.eyebrow} title={header.title}>
        <EndedNotice />
      </PageHeader>

      {service && (
        <Section>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
            <div>
              <SectionHeader eyebrow={about.eyebrow} title={service.title} text={service.tagline} align="left" />
              {service.description.flatMap((block) => block.paragraphs ?? []).map((p) => (
                <p key={p} className="mt-6 max-w-3xl leading-relaxed text-slate-600">
                  {p}
                </p>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-navy-900 text-brand-400">
                <service.icon aria-hidden className="size-6" />
              </div>
              <ServiceFacts facts={service.facts} className="mt-6 flex-col" />
              <ButtonLink href={servicePath(service.slug)} variant="outline" arrow className="mt-6 w-full">
                {about.more}
              </ButtonLink>
            </div>
          </div>
        </Section>
      )}

      <Section tone="muted">
        <SectionHeader eyebrow={steps.eyebrow} title={steps.title} text={steps.text} />
        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.items.map((step, i) => (
            <li
              key={step.title}
              className="relative lg:not-last:after:absolute lg:not-last:after:top-6 lg:not-last:after:-right-4 lg:not-last:after:left-14 lg:not-last:after:h-px lg:not-last:after:bg-navy-200"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-navy-950 text-lg font-bold text-brand-400">
                {i + 1}
              </span>
              <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        {/* Same centered closing card as the other inner pages (Funcționalități, Soluții, Prețuri). */}
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 px-6 py-14 text-center sm:px-12 lg:py-16">
          <div
            aria-hidden
            className="absolute -bottom-32 -right-20 -z-10 size-96 rounded-full bg-brand-400/20 blur-3xl"
          />
          <div aria-hidden className="absolute -left-24 -top-32 -z-10 size-80 rounded-full bg-navy-600/40 blur-3xl" />
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">{finalCta.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-200">{finalCta.text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={finalCta.primary.href} arrow>
              {finalCta.primary.label}
            </ButtonLink>
            <ButtonLink href={finalCta.secondary.href} variant="outline-light">
              {finalCta.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
