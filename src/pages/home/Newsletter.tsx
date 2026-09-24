import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Mail } from "lucide-react";
import { newsletter } from "../../content/home";
import { ApiError } from "../../lib/api";
import { subscribeToNewsletter } from "../../lib/forms";
import { Container } from "../../components/ui/Section";

type Status = "idle" | "sending" | "done" | "error";
type Errors = { email?: string; consent?: string };

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** Same look as the contact form's field errors. */
function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex gap-1.5 text-sm font-medium text-red-600">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

export function Newsletter() {
  const uid = useId();
  const emailId = `${uid}-email`;
  const consentId = `${uid}-consent`;
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const consent = form.get("consent") === "on";

    // Checked here rather than by the browser, so the messages are in Romanian and in the page's style.
    const problems: Errors = {};
    if (!email) problems.email = newsletter.errors.emailMissing;
    else if (!EMAIL.test(email)) problems.email = newsletter.errors.email;
    if (!consent) problems.consent = newsletter.errors.consent;
    setErrors(problems);
    if (problems.email || problems.consent) {
      (problems.email ? emailRef : consentRef).current?.focus();
      return;
    }

    setStatus("sending");
    try {
      await subscribeToNewsletter({ email, consent, website: String(form.get("website") ?? "") });
      setStatus("done");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? Object.values(err.fields)[0] ?? err.message
          : "Nu am putut finaliza abonarea. Te rugăm să încerci din nou.",
      );
      setStatus("error");
    }
  }

  const clear = (field: keyof Errors) => setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  return (
    <section className="border-t border-slate-200 bg-white py-16">
      <Container className="grid items-center gap-8 lg:grid-cols-2">
        {/* The icon about as tall as the title and text together, centred on them. */}
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-brand-400">
            <Mail aria-hidden className="size-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight">{newsletter.title}</h2>
            <p className="mt-1 text-slate-600">{newsletter.text}</p>
          </div>
        </div>

        {status === "done" ? (
          <p role="status" className="flex items-center gap-2 font-semibold text-brand-700">
            <CircleCheck aria-hidden className="size-5" /> Mulțumim! Te-ai abonat cu succes.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor={emailId} className="sr-only">
                  Email
                </label>
                <input
                  ref={emailRef}
                  id={emailId}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="adresa@email.ro"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? `${emailId}-error` : undefined}
                  onInput={() => clear("email")}
                  className={`min-w-0 flex-1 rounded-full border px-5 py-3 text-navy-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    errors.email ? "border-red-500 focus:ring-red-500/25" : "border-slate-300 focus:border-brand-600 focus:ring-brand-500/30"
                  }`}
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "sending" ? "Se trimite…" : newsletter.button}
                </button>
              </div>
              {errors.email && <FieldError id={`${emailId}-error`}>{errors.email}</FieldError>}
            </div>
            {/* Honeypot: hidden from people, filled in by naive bots. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            <div>
              <label htmlFor={consentId} className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  ref={consentRef}
                  id={consentId}
                  type="checkbox"
                  name="consent"
                  required
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? `${consentId}-error` : undefined}
                  onChange={(e) => e.target.checked && clear("consent")}
                  className={`mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-600 ${errors.consent ? "outline-2 outline-offset-2 outline-red-500" : ""}`}
                />
                {newsletter.consent}
              </label>
              {errors.consent && <FieldError id={`${consentId}-error`}>{errors.consent}</FieldError>}
            </div>
            {status === "error" && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}
          </form>
        )}
      </Container>
    </section>
  );
}
