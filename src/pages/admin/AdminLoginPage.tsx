import { useId, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import logo from "../../assets/logo.png";
import { login } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";
import { useAdmin } from "../../components/admin/AdminContext";
import { Alert, Button, Field, fieldAria, inputClass, errorMessage } from "../../components/admin/ui";
import { PageMeta } from "../../components/ui/PageMeta";
import type { LoginRedirectState } from "./AdminLayout";

export function AdminLoginPage() {
  const { signedIn } = useAdmin();
  const [params] = useSearchParams();
  const state = (useLocation().state ?? {}) as LoginRedirectState;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<{ email?: string; password?: string }>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const expired = state.sessionExpired || params.get("expired") === "1";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const missing = {
      email: email.trim() ? undefined : "Introduceți adresa de email.",
      password: password ? undefined : "Introduceți parola.",
    };
    setFields(missing);
    setError(null);
    if (missing.email || missing.password) {
      (missing.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setBusy(true);
    try {
      const session = await login(email.trim(), password);
      setPassword("");
      signedIn(session.email); // the layout then redirects to ?next= (admin paths only)
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 401) {
        setPassword("");
        passwordRef.current?.focus();
      }
      setError(errorMessage(err, "Autentificarea a eșuat. Încercați din nou."));
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4 py-12">
      <PageMeta title="Autentificare · Administrare" />
      <div aria-hidden className="absolute -right-32 -top-32 -z-10 size-[28rem] rounded-full bg-brand-500/10 blur-3xl" />
      <div aria-hidden className="absolute -bottom-40 -left-20 -z-10 size-96 rounded-full bg-navy-600/30 blur-3xl" />

      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex items-center justify-center gap-2.5">
          <img src={logo} alt="" width={40} height={40} className="size-10" />
          <span className="text-2xl font-bold tracking-tight text-white">
            eMIP<sup className="ml-0.5 text-[0.55em] font-medium text-brand-400">®</sup>
          </span>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <LockKeyhole aria-hidden className="size-5" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Autentificare</h1>
          <p className="mt-1 text-sm text-slate-600">Panoul de administrare al blogului eMIP.</p>

          <div className="mt-6 space-y-3 empty:hidden">
            {expired && !error && (
              <Alert tone="warning" live>
                Sesiunea a expirat. Autentificați-vă din nou pentru a continua.
              </Alert>
            )}
            {state.loggedOut && !error && (
              <Alert tone="success" live>
                V-ați deconectat.
              </Alert>
            )}
            {error && <Alert tone="error">{error}</Alert>}
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5" aria-busy={busy}>
            <Field id={`${id}-email`} label="Email" error={fields.email}>
              <input
                {...fieldAria(`${id}-email`, { error: fields.email })}
                ref={emailRef}
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field id={`${id}-password`} label="Parolă" error={fields.password}>
              <div className="relative">
                <input
                  {...fieldAria(`${id}-password`, { error: fields.password })}
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-500 hover:text-navy-950"
                >
                  {showPassword ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                </button>
              </div>
            </Field>

            <Button type="submit" variant="primary" busy={busy} className="w-full py-3">
              {busy ? "Se verifică…" : "Intră în cont"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white">
            <ArrowLeft aria-hidden className="size-4" /> Înapoi la site
          </Link>
        </p>
      </div>
    </main>
  );
}
