import { isRouteErrorResponse, useRouteError } from "react-router";
import { RefreshCw } from "lucide-react";
import { PlaceholderPage } from "../../pages/PlaceholderPage";
import { Container } from "../ui/Section";

export function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <PlaceholderPage notFound />;

  console.error(error);
  return (
    <Container className="flex flex-col items-center py-32 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">A apărut o eroare</h1>
      <p className="mt-4 max-w-md text-lg text-slate-600">
        Nu am putut încărca această pagină. Verificați conexiunea și încercați din nou.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800"
      >
        <RefreshCw aria-hidden className="size-4" /> Reîncarcă pagina
      </button>
    </Container>
  );
}
