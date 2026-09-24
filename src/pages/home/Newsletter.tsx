import { useState, type FormEvent } from "react";
import { CircleCheck, Mail } from "lucide-react";
import { newsletter } from "../../content/home";
import { ApiError } from "../../lib/api";
import { subscribeToNewsletter } from "../../lib/forms";
import { Container } from "../../components/ui/Section";

type Status = "idle" | "sending" | "done" | "error";

export function Newsletter() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    try {
      await subscribeToNewsletter({
        email: String(form.get("email") ?? ""),
        consent: form.get("consent") === "on",
        website: String(form.get("website") ?? ""),
      });
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

  return (
    <section className="border-t border-slate-200 bg-white py-16">
      <Container className="grid items-center gap-8 lg:grid-cols-2">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-brand-400">
            <Mail aria-hidden className="size-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{newsletter.title}</h2>
            <p className="mt-2 text-slate-600">{newsletter.text}</p>
          </div>
        </div>

        {status === "done" ? (
          <p role="status" className="flex items-center gap-2 font-semibold text-brand-700">
            <CircleCheck aria-hidden className="size-5" /> Mulțumim! Te-ai abonat cu succes.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Email
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="adresa@email.ro"
                className="min-w-0 flex-1 rounded-full border border-slate-300 px-5 py-3 text-navy-950 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "sending" ? "Se trimite…" : newsletter.button}
              </button>
            </div>
            {/* Honeypot: hidden from people, filled in by naive bots. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-brand-600" />
              {newsletter.consent}
            </label>
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
