import { intro, meta } from "../../content/preturi";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Comparison } from "./Comparison";
import { Faq } from "./Faq";
import { PricingCta } from "./PricingCta";
import { ProductTabs } from "./ProductTabs";

export function PreturiPage() {
  return (
    <>
      <PageMeta title={meta.title} description={meta.description} />
      <PageHeader eyebrow={intro.eyebrow} title={intro.title} text={intro.text} />
      <ProductTabs />
      <Comparison />
      <Faq />
      <PricingCta />
    </>
  );
}
