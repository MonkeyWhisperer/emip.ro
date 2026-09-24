import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ChevronDown, CircleAlert, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { contactPage } from "../../content/contact";
import { contact } from "../../content/site";
import { ApiError } from "../../lib/api";
import { sendContactMessage } from "../../lib/forms";

const { form: copy } = contactPage;

type FieldName = "firstName" | "lastName" | "email" | "phone" | "company" | "subject" | "message" | "consent";
type Errors = Partial<Record<FieldName, string>>;
type Status = "idle" | "sending" | "done" | "error";

/** Visual order of the fields, used to focus the first invalid one. */
const FIELDS: FieldName[] = ["firstName", "lastName", "email", "phone", "company", "subject", "message", "consent"];
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

const hasErrors = (errors: Errors) => Object.keys(errors).length > 0;
/** "intrebari despre preturi" matches "Întrebări despre Prețuri". */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

/** Same rules as the API (server/forms.ts), so most mistakes are caught before sending. */
function validate(v: { firstName: string; lastName: string; email: string; message: string; consent: boolean }) {
  const errors: Errors = {};
  if (!v.firstName) errors.firstName = copy.errors.firstName;
  if (!v.lastName) errors.lastName = copy.errors.lastName;
  if (!v.email) errors.email = copy.errors.emailMissing;
  else if (!EMAIL.test(v.email)) errors.email = copy.errors.email;
  if (!v.message) errors.message = copy.errors.message;
  else if (v.message.length < 5) errors.message = copy.errors.messageShort;
  if (!v.consent) errors.consent = copy.errors.consent;
  return errors;
}

/** The API validates a single "name" ("Numele este obligatoriu."); it is shown on the "Nume" field. */
function fromServer(fields: Record<string, string>) {
  const errors: Errors = {};
  for (const [key, message] of Object.entries(fields)) {
    const name = key === "name" ? "lastName" : (key as FieldName);
    if (FIELDS.includes(name)) errors[name] = message;
  }
  return errors;
}

const control =
  "block w-full rounded-xl border bg-white px-4 py-3 text-navy-950 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2";
const controlOk = "border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-brand-500/30";
const controlBad = "border-red-500 focus:border-red-600 focus:ring-red-500/30";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
};

function Field({ id, label, required, error, className = "", children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy-900">
        {label}
        {required && (
          <span aria-hidden className="text-red-600">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex gap-1.5 text-sm font-medium text-red-600">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

export function ContactForm() {
  const uid = useId();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [serverMessage, setServerMessage] = useState("");
  const successRef = useRef<HTMLHeadingElement>(null);
  const focusFirstField = useRef(false);

  // Other pages link to /contact?subiect=... to preselect the subject.
  const requested = (params.get("subiect") ?? "").trim().slice(0, 200);
  const preset = copy.subjects.find((s) => fold(s) === fold(requested));
  const subjects = requested && !preset ? [requested, ...copy.subjects] : copy.subjects;
  const defaultSubject = preset ?? (requested || copy.subjects[0]);

  const idOf = (name: FieldName) => `${uid}-${name}`;
  const controlProps = (name: FieldName, extra = "") => ({
    id: idOf(name),
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${idOf(name)}-error` : undefined,
    className: `${control} ${errors[name] ? controlBad : controlOk} ${extra}`,
  });

  // Move focus with the view: to the confirmation after sending, back to the form after "send another".
  useEffect(() => {
    if (status === "done") successRef.current?.focus();
    if (status === "idle" && focusFirstField.current) {
      focusFirstField.current = false;
      document.getElementById(`${uid}-firstName`)?.focus();
    }
  }, [status, uid]);

  function showErrors(form: HTMLFormElement, found: Errors) {
    setErrors(found);
    setStatus("idle");
    const first = FIELDS.find((name) => found[name]);
    const el = first && form.elements.namedItem(first);
    if (el instanceof HTMLElement) el.focus();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? "").trim();
    const values = {
      firstName: text("firstName"),
      lastName: text("lastName"),
      email: text("email"),
      phone: text("phone"),
      company: text("company"),
      subject: text("subject"),
      message: text("message"),
      consent: data.get("consent") === "on",
      website: String(data.get("website") ?? ""),
    };

    const found = validate(values);
    if (hasErrors(found)) return showErrors(form, found);

    setErrors({});
    setServerMessage("");
    setStatus("sending");
    try {
      await sendContactMessage({
        name: `${values.firstName} ${values.lastName}`,
        email: values.email,
        phone: values.phone || undefined,
        company: values.company || undefined,
        subject: values.subject || undefined,
        message: values.message,
        consent: values.consent,
        website: values.website,
      });
      setStatus("done");
    } catch (err) {
      const fields = err instanceof ApiError ? fromServer(err.fields) : {};
      if (hasErrors(fields)) return showErrors(form, fields);
      // Rate limiting returns a message meant for visitors; anything else gets the generic text.
      setServerMessage(err instanceof ApiError && err.status === 429 ? err.message : "");
      setStatus("error");
    }
  }

  function clearError(e: FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name as FieldName;
    if (!errors[name]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function startOver() {
    focusFirstField.current = true;
    setStatus("idle");
  }

  // Top padding as in the Contact card beside it (sm:p-8), so both titles start at the same height.
  const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-navy-900/5 sm:p-8 lg:p-10 lg:pt-8";

  if (status === "done") {
    return (
      <div className={`${card} flex flex-col items-center justify-center text-center lg:h-full`}>
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <CircleCheck aria-hidden className="size-7" />
        </span>
        <h2 ref={successRef} tabIndex={-1} className="mt-5 text-2xl font-bold tracking-tight focus:outline-none">
          {copy.success.title}
        </h2>
        <p className="mt-3 max-w-md text-slate-600">{copy.success.text}</p>
        <button
          type="button"
          onClick={startOver}
          className="mt-8 inline-flex items-center justify-center rounded-full border border-navy-200 px-6 py-3 text-sm font-semibold text-navy-900 transition-colors hover:border-navy-600 hover:bg-navy-50"
        >
          {copy.success.again}
        </button>
      </div>
    );
  }

  const titleId = `${uid}-title`;
  const sending = status === "sending";

  return (
    <div className={card}>
      <h2 id={titleId} className="text-2xl font-bold tracking-tight">
        {copy.title}
      </h2>

      <form
        onSubmit={handleSubmit}
        onChange={clearError}
        noValidate
        aria-labelledby={titleId}
        className="mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2"
      >
        <Field id={idOf("firstName")} label={copy.labels.firstName} required error={errors.firstName}>
          <input {...controlProps("firstName")} type="text" required autoComplete="given-name" maxLength={60} />
        </Field>
        <Field id={idOf("lastName")} label={copy.labels.lastName} required error={errors.lastName}>
          <input {...controlProps("lastName")} type="text" required autoComplete="family-name" maxLength={60} />
        </Field>
        <Field id={idOf("email")} label={copy.labels.email} required error={errors.email}>
          <input
            {...controlProps("email")}
            type="email"
            required
            autoComplete="email"
            maxLength={200}
            placeholder={copy.placeholders.email}
          />
        </Field>
        <Field id={idOf("phone")} label={copy.labels.phone} error={errors.phone}>
          <input {...controlProps("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={40} />
        </Field>
        <Field id={idOf("company")} label={copy.labels.company} error={errors.company}>
          <input {...controlProps("company")} type="text" autoComplete="organization" maxLength={160} />
        </Field>
        <Field id={idOf("subject")} label={copy.labels.subject} required error={errors.subject}>
          <div className="relative">
            <select
              key={defaultSubject}
              {...controlProps("subject", "cursor-pointer appearance-none truncate pr-11")}
              required
              defaultValue={defaultSubject}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-500"
            />
          </div>
        </Field>
        <Field id={idOf("message")} label={copy.labels.message} required error={errors.message} className="sm:col-span-2">
          <textarea
            {...controlProps("message", "min-h-40 resize-y")}
            required
            rows={6}
            maxLength={5000}
            placeholder={copy.placeholders.message}
          />
        </Field>

        {/* Honeypot: hidden from people, filled in by naive bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

        <div className="sm:col-span-2">
          <div className="flex items-start gap-3">
            <input
              id={idOf("consent")}
              name="consent"
              type="checkbox"
              required
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? `${idOf("consent")}-error` : undefined}
              // 16px box centred on the label's first 20px line.
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-600"
            />
            <label htmlFor={idOf("consent")} className="text-xs leading-5 text-slate-600">
              {copy.consent.before}
              <a
                href={copy.consent.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
              >
                {copy.consent.link.label}
                <span className="sr-only"> (se deschide într-o filă nouă)</span>
              </a>
              <span aria-hidden className="text-red-600">
                {" "}
                *
              </span>
            </label>
          </div>
          {errors.consent && <FieldError id={`${idOf("consent")}-error`}>{errors.consent}</FieldError>}
        </div>

        <div className="space-y-4 sm:col-span-2">
          {status === "error" ? (
            <p role="alert" className="flex gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                {serverMessage || (
                  <>
                    {copy.errors.generic}{" "}
                    <a href={`mailto:${contact.email}`} className="font-semibold underline underline-offset-2">
                      {contact.email}
                    </a>
                    .
                  </>
                )}
              </span>
            </p>
          ) : (
            hasErrors(errors) && (
              <p role="alert" className="flex gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {copy.errors.summary}
              </p>
            )
          )}

          {/* aria-disabled instead of disabled: a disabled button drops keyboard focus to <body>.
              Double submits are blocked in handleSubmit. */}
          <button
            type="submit"
            aria-disabled={sending || undefined}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-900 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 aria-disabled:cursor-wait aria-disabled:opacity-70 sm:w-auto"
          >
            {sending ? (
              <LoaderCircle aria-hidden className="size-4 animate-spin" />
            ) : (
              <Send aria-hidden className="size-4" />
            )}
            {sending ? copy.sending : copy.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
