import { Arch } from "./Arch";
import { Benefits } from "./Benefits";
import { BlogPreview } from "./BlogPreview";
import { Features } from "./Features";
import { FinalCta } from "./FinalCta";
import { FundedProjects } from "./FundedProjects";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Newsletter } from "./Newsletter";
import { Trust } from "./Trust";
import { UseCases } from "./UseCases";
import { PageMeta } from "../../components/ui/PageMeta";
import { homeJsonLd } from "../../../shared/seo";

export function HomePage() {
  return (
    <>
      <PageMeta
        title="Platforma eMIP"
        description="Platforma #1 pentru implementarea proiectelor PEO & PIDS. Conformitate MIPE, raportare automată și gestionarea proiectelor, echipelor și bugetelor dintr-o singură platformă."
        jsonLd={homeJsonLd}
      />
      <Hero />
      <Benefits />
      <Trust />
      <Features />
      <Arch />
      <FundedProjects />
      <HowItWorks />
      <UseCases />
      <FinalCta />
      <BlogPreview />
      <Newsletter />
    </>
  );
}
