import { Construction, FileQuestionMark } from "lucide-react";
import { ButtonLink } from "../components/ui/ButtonLink";
import { PageMeta } from "../components/ui/PageMeta";
import { Container } from "../components/ui/Section";

/** Stands in for pages that have not been rebuilt yet, and for unknown URLs. */
export function PlaceholderPage({ notFound = false }: { notFound?: boolean }) {
  const Icon = notFound ? FileQuestionMark : Construction;
  return (
    <Container className="flex flex-col items-center py-32 text-center">
      <PageMeta title={notFound ? "Pagina nu a fost găsită" : "Pagina este în lucru"} />
      <meta name="robots" content="noindex" />
      <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon aria-hidden className="size-7" />
      </div>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
        {notFound ? "Pagina nu a fost găsită" : "Pagina este în lucru"}
      </h1>
      <p className="mt-4 max-w-md text-lg text-slate-600">
        {notFound
          ? "Adresa accesată nu există sau a fost mutată."
          : "Reconstruim această secțiune a site-ului. Revino în curând."}
      </p>
      <ButtonLink href="/" variant="dark" className="mt-8">
        Înapoi la pagina principală
      </ButtonLink>
    </Container>
  );
}
