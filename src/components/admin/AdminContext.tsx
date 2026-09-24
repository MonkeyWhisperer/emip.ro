import { createContext, useContext } from "react";

export type ToastTone = "success" | "error" | "info";

export type AdminContextValue = {
  /** Email of the logged-in admin, or null on the login page. */
  email: string | null;
  /** Called by the login page after a successful login. */
  signedIn: (email: string) => void;
  /** Number of unread contact messages (null until loaded). */
  unread: number | null;
  setUnread: (count: number) => void;
  /** Short confirmation message in the corner of the screen. */
  toast: (message: string, tone?: ToastTone) => void;
  /**
   * Lets a page with unsaved changes (the post editor, the AI assistant settings) ask before the admin logs out.
   * Pass null to unregister.
   */
  setLeaveGuard: (guard: (() => boolean) | null) => void;
};

export const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdmin() must be used inside <AdminLayout>.");
  return value;
}
