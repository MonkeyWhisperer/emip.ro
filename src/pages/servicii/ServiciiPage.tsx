import { Info } from "lucide-react";
import { services, serviciiPage } from "../../content/servicii";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Section } from "../../components/ui/Section";
import { ServiceCard } from "./ServiceCard";

export function ServiciiPage() {
  const { meta, header, bookingNote } = serviciiPage;
  return (
    <>
      <PageMeta title={meta.title} description={meta.description} />
      <PageHeader eyebrow={header.eyebrow} title={header.title} text={header.text} />

      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>

        <p className="mx-auto mt-10 flex max-w-2xl gap-2 text-sm text-slate-500">
          <Info aria-hidden className="mt-1 size-4 shrink-0" />
          {bookingNote}
        </p>
      </Section>
    </>
  );
}
