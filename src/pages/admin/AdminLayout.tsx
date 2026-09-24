import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router";
import { LoaderCircle, RefreshCw, ServerCrash } from "lucide-react";
import { getSession, listSubmissions, logout, setUnauthorizedHandler } from "../../lib/adminApi";
import { AdminContext, type AdminContextValue } from "../../components/admin/AdminContext";
import { AdminShell } from "../../components/admin/AdminShell";
import { ConfirmDialog } from "../../components/admin/Dialog";
import { ToastRegion, useToasts } from "../../components/admin/Toasts";
import { clearSessionLost, markSessionLost } from "../../components/admin/draftStash";
import { LOGIN_PATH, loginUrl, safeAdminPath } from "../../components/admin/safeNext";
import { Button, errorMessage, isUnauthorized } from "../../components/admin/ui";
import { PageMeta } from "../../components/ui/PageMeta";

/** State passed along with redirects to the login page (shown as a notice there). */
export type LoginRedirectState = { sessionExpired?: boolean; loggedOut?: boolean };

type Session =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "anonymous" }
  /** Logged out, or the session expired while on an admin page: redirect to login. */
  | { status: "signed-out"; to: string; state: LoginRedirectState }
  | { status: "authenticated"; email: string };

const isLoginPath = (pathname: string) => pathname.replace(/\/+$/, "") === LOGIN_PATH;

export function AdminLayout() {
  const location = useLocation();
  const [params] = useSearchParams();
  const [session, setSession] = useState<Session>({ status: "loading" });
  const [unread, setUnread] = useState<number | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { toasts, toast, dismiss } = useToasts();
  const leaveGuard = useRef<(() => boolean) | null>(null);
  const locationRef = useRef(location);

  useLayoutEffect(() => {
    locationRef.current = location;
  }, [location]);

  const checkSession = useCallback(() => {
    setSession({ status: "loading" });
    getSession()
      .then(({ email }) => setSession({ status: "authenticated", email }))
      .catch((err) =>
        setSession(isUnauthorized(err) ? { status: "anonymous" } : { status: "error", message: errorMessage(err) }),
      );
  }, []);

  useEffect(checkSession, [checkSession]);

  // Any admin call answering 401: the session expired (or was revoked). Back to login,
  // remembering where the admin was; the editor keeps unsaved changes in memory.
  useEffect(
    () =>
      setUnauthorizedHandler(() => {
        const { pathname, search } = locationRef.current;
        if (isLoginPath(pathname)) return;
        markSessionLost();
        setUnread(null);
        setSession((s) =>
          s.status === "signed-out" ? s : { status: "signed-out", to: loginUrl(pathname + search, true), state: { sessionExpired: true } },
        );
      }),
    [],
  );

  // Unread contact messages for the nav badge; refreshed on every admin navigation.
  const authenticated = session.status === "authenticated";
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    listSubmissions("contact")
      .then((list) => !cancelled && setUnread(list.filter((m) => !m.read).length))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authenticated, location.pathname]);

  const signOut = useCallback(async () => {
    setConfirmSignOut(false);
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // Even if the server is unreachable, leave the admin; the cookie expires on its own.
    }
    setSigningOut(false);
    setUnread(null);
    setSession({ status: "signed-out", to: LOGIN_PATH, state: { loggedOut: true } });
  }, []);

  const requestSignOut = useCallback(() => {
    if (leaveGuard.current?.()) setConfirmSignOut(true);
    else void signOut();
  }, [signOut]);

  const context = useMemo<AdminContextValue>(
    () => ({
      email: session.status === "authenticated" ? session.email : null,
      signedIn: (email) => {
        clearSessionLost();
        setSession({ status: "authenticated", email });
      },
      unread,
      setUnread,
      toast,
      setLeaveGuard: (guard) => {
        leaveGuard.current = guard;
      },
    }),
    [session, unread, toast],
  );

  const meta = <meta name="robots" content="noindex, nofollow" />;
  const onLogin = isLoginPath(location.pathname);

  if (session.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100" aria-busy="true">
        <PageMeta title="Administrare" />
        {meta}
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <LoaderCircle aria-hidden className="size-5 animate-spin text-brand-600" /> Se verifică sesiunea…
        </p>
      </div>
    );
  }

  if (session.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <PageMeta title="Administrare" />
        {meta}
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ServerCrash aria-hidden className="mx-auto size-10 text-slate-400" />
          <h1 className="mt-4 text-xl font-bold">Panoul de administrare nu este disponibil</h1>
          <p className="mt-2 text-sm text-slate-600">{session.message}</p>
          <Button className="mt-6" icon={RefreshCw} onClick={checkSession}>
            Încearcă din nou
          </Button>
        </div>
      </main>
    );
  }

  if (onLogin) {
    if (session.status === "authenticated") return <Navigate to={safeAdminPath(params.get("next"))} replace />;
    return (
      <AdminContext.Provider value={context}>
        {meta}
        <Outlet />
      </AdminContext.Provider>
    );
  }

  if (session.status === "anonymous") return <Navigate to={loginUrl(location.pathname + location.search)} replace />;
  if (session.status === "signed-out") return <Navigate to={session.to} state={session.state} replace />;

  return (
    <AdminContext.Provider value={context}>
      {meta}
      <AdminShell email={session.email} unread={unread} onSignOut={requestSignOut} signingOut={signingOut}>
        <Outlet />
      </AdminShell>
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
      <ConfirmDialog
        open={confirmSignOut}
        title="Aveți modificări nesalvate"
        description="Dacă vă deconectați acum, modificările nesalvate de pe această pagină se pierd."
        confirmLabel="Deconectare fără salvare"
        cancelLabel="Rămân pe pagină"
        onConfirm={() => void signOut()}
        onCancel={() => setConfirmSignOut(false)}
      />
    </AdminContext.Provider>
  );
}
