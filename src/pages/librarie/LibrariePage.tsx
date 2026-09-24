import { librarie } from "../../content/librarie";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Section } from "../../components/ui/Section";
import { LibraryBrowser } from "./LibraryBrowser";

export function LibrariePage() {
  return (
    <>
      <PageMeta title={librarie.meta.title} description={librarie.meta.description} />
      <PageHeader eyebrow={librarie.header.eyebrow} title={librarie.header.title} text={librarie.header.text} />
      <Section tone="muted">
        <LibraryBrowser />
      </Section>
    </>
  );
}
