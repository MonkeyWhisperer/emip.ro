import { contactPage } from "../../content/contact";
import { DemoButton } from "../../components/ui/DemoButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Section } from "../../components/ui/Section";
import { ContactDetails } from "./ContactDetails";
import { ContactForm } from "./ContactForm";
import { ContactTeam } from "./ContactTeam";

const { meta, header } = contactPage;

export function ContactPage() {
  return (
    <>
      <PageMeta title={meta.title} description={meta.description} />
      <PageHeader eyebrow={header.eyebrow} title={header.title} text={header.text}>
        <DemoButton href={header.cta.href} arrow>
          {header.cta.label}
        </DemoButton>
      </PageHeader>

      {/* Mobile: details, form, team. Desktop: details and team on the left, the form on the right. */}
      <Section tone="muted">
        <div className="grid items-start gap-6 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-8">
          <div className="lg:col-span-5">
            <ContactDetails />
          </div>
          <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-stretch">
            <ContactForm />
          </div>
          <div className="lg:col-span-5 lg:col-start-1 lg:row-start-2">
            <ContactTeam />
          </div>
        </div>
      </Section>
    </>
  );
}
