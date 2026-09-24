import { Navigate, useParams } from "react-router";
import { CircleCheck, Mail, MapPin, Phone, Wifi } from "lucide-react";
import {
  contactHref,
  findService,
  serviceAliases,
  serviceLabels,
  servicePath,
  services,
  type ServiceSection,
} from "../../content/servicii";
import { contact } from "../../content/site";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Section } from "../../components/ui/Section";
import { PlaceholderPage } from "../PlaceholderPage";
import { ServiceCard, ServiceFacts } from "./ServiceCard";

function DescriptionBlock({ title, paragraphs = [], items = [] }: ServiceSection) {
  return (
    <div className="mt-8 first:mt-0">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {paragraphs.map((p) => (
        <p key={p} className="mt-3 leading-relaxed text-slate-600 first:mt-0 sm:text-lg">
          {p}
        </p>
      ))}
      {items.length > 0 && (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 leading-relaxed text-slate-600 sm:text-lg">
              <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-600 sm:mt-1" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ServicePage() {
  const slug = useParams().slug ?? "";
  const service = findService(slug);

  if (!service) {
    const alias = serviceAliases[slug];
    return alias ? <Navigate to={servicePath(alias)} replace /> : <PlaceholderPage notFound />;
  }

  const bookHref = contactHref(service.bookingSubject);
  const others = services.filter((s) => s.slug !== service.slug);
  const contactItems = [
    { icon: MapPin, label: `${contact.street}, ${contact.city}` },
    { icon: Phone, label: contact.phone, href: contact.phoneHref },
    { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
  ];

  return (
    <>
      <PageMeta title={service.title} description={service.metaDescription} />
      <PageHeader eyebrow={serviceLabels.eyebrow} title={service.title} text={service.tagline}>
        <ul className="flex flex-wrap gap-2" aria-label={serviceLabels.summary}>
          {service.badge && (
            <li className="inline-flex items-center gap-2 rounded-full bg-brand-400 px-3.5 py-1.5 text-sm font-semibold text-navy-950">
              <Wifi aria-hidden className="size-4" />
              {service.badge}
            </li>
          )}
          {service.facts.map(({ icon: Icon, label, value }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white"
            >
              <Icon aria-hidden className="size-4 text-brand-400" />
              <span className="sr-only">{label}: </span>
              {value}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={bookHref} arrow>
            {serviceLabels.book}
          </ButtonLink>
          <ButtonLink href="/servicii" variant="outline-light">
            {serviceLabels.allServices}
          </ButtonLink>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{serviceLabels.descriptionTitle}</h2>
            <div className="mt-6">
              {service.description.map((block, i) => (
                <DescriptionBlock key={block.title ?? i} {...block} />
              ))}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold">{serviceLabels.bookingTitle}</h2>
              <ServiceFacts facts={service.facts} className="mt-5 flex-col" />
              <ButtonLink href={bookHref} variant="dark" arrow className="mt-6 w-full">
                {serviceLabels.book}
              </ButtonLink>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold">{serviceLabels.contactTitle}</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {contactItems.map(({ icon: Icon, label, href }) => (
                  <li key={label} className="flex gap-3">
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-700" />
                    {href ? (
                      <a href={href} className="font-medium text-navy-900 hover:text-brand-700">
                        {label}
                      </a>
                    ) : (
                      <span className="text-slate-600">{label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      {others.length > 0 && (
        <Section tone="muted">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{serviceLabels.otherServices}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:gap-8">
            {others.map((s) => (
              <ServiceCard key={s.slug} service={s} headingLevel="h3" />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
