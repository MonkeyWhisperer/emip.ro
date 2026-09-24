import { FileQuestion, Newspaper } from "lucide-react";
import { AdminButtonLink, AdminPageHeader, EmptyState } from "../../components/admin/ui";
import { PageMeta } from "../../components/ui/PageMeta";

/** Unknown /admin/* addresses stay inside the admin shell instead of the public 404. */
export function AdminNotFoundPage() {
  return (
    <>
      <PageMeta title="Pagină inexistentă | Administrare" />
      <AdminPageHeader title="Pagină inexistentă" />
      <EmptyState icon={FileQuestion} title="Această pagină de administrare nu există" text="Verificați adresa sau reveniți la lista de articole.">
        <AdminButtonLink to="/admin" icon={Newspaper}>
          Înapoi la articole
        </AdminButtonLink>
      </EmptyState>
    </>
  );
}
