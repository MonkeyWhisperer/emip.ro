import { intro, meta } from "../../content/despre";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Association } from "./Association";
import { Cta } from "./Cta";
import { Purpose } from "./Purpose";
import { Timeline } from "./Timeline";
import { Values } from "./Values";

export function DesprePage() {
  return (
    <>
      <PageMeta title={meta.title} description={meta.description} />
      <PageHeader eyebrow={intro.eyebrow} title={intro.title} text={intro.text} />
      <Purpose />
      <Values />
      <Timeline />
      <Association />
      <Cta />
    </>
  );
}
