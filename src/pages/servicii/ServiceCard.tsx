import { Link } from "react-router";
import { contactHref, servicePath, serviceLabels, type Service, type ServiceFact } from "../../content/servicii";
import { ButtonLink } from "../../components/ui/ButtonLink";

/** Duration, price and location of a service, as a definition list. */
export function ServiceFacts({ facts, className = "" }: { facts: ServiceFact[]; className?: string }) {
  return (
    <dl className={`flex flex-wrap gap-x-8 gap-y-4 ${className}`}>
      {facts.map(({ icon: Icon, label, value }) => (
        // A <div> inside a <dl> may only hold <dt>/<dd>, so the icon sits inside the <dt>.
        <div key={label} className="relative pl-8">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Icon aria-hidden className="absolute left-0 top-0.5 size-5 text-brand-700" />
            {label}
          </dt>
          <dd className="mt-0.5 font-semibold text-navy-950">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type Props = {
  service: Service;
  /** h2 on the service list, h3 under an "Alte servicii" heading. */
  headingLevel?: "h2" | "h3";
};

export function ServiceCard({ service, headingLevel: Heading = "h2" }: Props) {
  const { icon: Icon, slug, title, tagline, badge, facts, bookingSubject } = service;
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-navy-900/5 sm:p-8">
      {/* The badge follows the heading in the DOM, so the text version of the page (screen readers,
          the AI assistant's knowledge export) attaches it to this service, not the previous card.
          `order` still shows it top right, next to the icon; the heading wraps to its own row. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-navy-900 text-brand-400">
          <Icon aria-hidden className="size-6" />
        </div>
        <Heading className="order-last mt-6 w-full text-2xl font-bold tracking-tight">
          <Link to={servicePath(slug)} className="hover:text-brand-700">
            {title}
          </Link>
        </Heading>
        {badge && (
          <p className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">{badge}</p>
        )}
      </div>
      <p className="mt-2 leading-relaxed text-slate-600">{tagline}</p>

      {/* Pushed to the bottom so facts and buttons line up across cards of different length. */}
      <div className="mt-auto pt-6">
        <ServiceFacts facts={facts} className="border-t border-slate-200 pt-6" />
      </div>

      <div className="flex flex-col gap-3 pt-8 sm:flex-row">
        <ButtonLink href={contactHref(bookingSubject)} variant="dark" arrow>
          {serviceLabels.book} <span className="sr-only">– {title}</span>
        </ButtonLink>
        <ButtonLink href={servicePath(slug)} variant="outline">
          {serviceLabels.details} <span className="sr-only">– {title}</span>
        </ButtonLink>
      </div>
    </article>
  );
}
