import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBlocker } from "react-router";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Undo2, X } from "lucide-react";
import type { AiSettings } from "../../../../shared/ai";
import { saveAiSettings } from "../../../lib/aiAdminApi";
import { ApiError } from "../../../lib/api";
import { useAdmin } from "../AdminContext";
import { ConfirmDialog } from "../Dialog";
import { dropDraft, isSessionLost, peekDraft, stashDraft } from "../draftStash";
import { Alert, Button, Card, Field, FieldError, Toggle, errorMessage, fieldAria, inputClass, isUnauthorized, labelClass } from "../ui";
import { formatNumber } from "./shared";

// ---- form model ---------------------------------------------------------------------

type Suggestion = { key: number; text: string };

type Form = {
  enabled: boolean;
  welcome: string;
  suggestions: Suggestion[];
  useSiteContent: boolean;
  instructions: string;
  /** As typed, so an empty or half-typed number can be edited freely. */
  dailyLimit: string;
  logConversations: boolean;
};

type FieldKey = "welcome" | "suggestions" | "instructions" | "dailyLimit";
type Errors = Partial<Record<FieldKey, string>>;
const FIELD_ORDER: FieldKey[] = ["welcome", "suggestions", "instructions", "dailyLimit"];

const WELCOME_MAX = 500;
const SUGGESTIONS_MAX = 6;
const SUGGESTION_MAX = 120;
const INSTRUCTIONS_MAX = 4000;
const LIMIT_MAX = 100_000;
const DRAFT_KEY = "ai-settings";

const INSTRUCTIONS_EXAMPLE = `- Când cineva întreabă de prețuri, recomandă și demo-ul interactiv.
- Încheie răspunsurile despre raportarea MIPE cu o invitație la un workshop de prezentare.
- Dacă vizitatorul pare o instituție publică, recomandă o discuție cu echipa prin pagina Contact.`;

let nextSuggestionKey = 1;
const suggestion = (text: string): Suggestion => ({ key: nextSuggestionKey++, text });

const toForm = (s: AiSettings): Form => ({
  enabled: s.enabled,
  welcome: s.welcome,
  suggestions: s.suggestions.map(suggestion),
  useSiteContent: s.useSiteContent,
  instructions: s.instructions,
  dailyLimit: String(s.dailyLimit),
  logConversations: s.logConversations,
});

const toSettings = (f: Form): AiSettings => ({
  enabled: f.enabled,
  welcome: f.welcome.trim(),
  suggestions: f.suggestions.map((s) => s.text.trim()).filter(Boolean),
  useSiteContent: f.useSiteContent,
  instructions: f.instructions.trim(),
  dailyLimit: Number(f.dailyLimit),
  logConversations: f.logConversations,
});

/** Compares what the admin sees (suggestion keys are only for React). */
const sameForm = (a: Form, b: Form) =>
  JSON.stringify({ ...a, suggestions: a.suggestions.map((s) => s.text) }) ===
  JSON.stringify({ ...b, suggestions: b.suggestions.map((s) => s.text) });

function validate(f: Form): Errors {
  const errors: Errors = {};
  if (!f.welcome.trim()) errors.welcome = "Mesajul de întâmpinare este obligatoriu.";
  else if (f.welcome.trim().length > WELCOME_MAX) errors.welcome = `Mesajul poate avea cel mult ${WELCOME_MAX} de caractere.`;
  const filled = f.suggestions.filter((s) => s.text.trim());
  if (filled.length > SUGGESTIONS_MAX || filled.some((s) => s.text.trim().length > SUGGESTION_MAX)) {
    errors.suggestions = `Maximum ${SUGGESTIONS_MAX} întrebări, de cel mult ${SUGGESTION_MAX} de caractere.`;
  }
  if (f.instructions.trim().length > INSTRUCTIONS_MAX) errors.instructions = `Instrucțiunile pot avea cel mult ${INSTRUCTIONS_MAX} de caractere.`;
  const limit = Number(f.dailyLimit);
  if (f.dailyLimit.trim() === "" || !Number.isInteger(limit) || limit < 0 || limit > LIMIT_MAX) {
    errors.dailyLimit = `Introduceți un număr întreg între 0 și ${formatNumber(LIMIT_MAX)}.`;
  }
  return errors;
}

// ---- component ------------------------------------------------------------------------

type Props = {
  settings: AiSettings;
  configured: boolean;
  usageToday: number;
  /** Uploaded training files that are indexed (the only knowledge left with site content off). */
  readyUploads: number;
  /** The "Setări" tab is visible (Ctrl+S saves only then). */
  active: boolean;
  onSaved: (settings: AiSettings, previous: AiSettings) => void;
  onDirtyChange: (dirty: boolean) => void;
  onOpenSources: () => void;
};

/** "Setări" tab: what visitors see in the chat, knowledge sources, extra instructions, the daily limit and logging. */
export function SettingsPanel({ settings, configured, usageToday, readyUploads, active, onSaved, onDirtyChange, onOpenSources }: Props) {
  const { toast, setLeaveGuard } = useAdmin();
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;

  const [initial] = useState(() => ({ base: toForm(settings), draft: peekDraft<Form>(DRAFT_KEY) }));
  const [baseline, setBaseline] = useState<Form>(initial.base);
  const [form, setForm] = useState<Form>(initial.draft ?? initial.base);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = !sameForm(form, baseline);

  const dirtyRef = useRef(dirty);
  const formRef = useRef(form);
  const settingsRef = useRef(settings);
  useLayoutEffect(() => {
    dirtyRef.current = dirty;
    formRef.current = form;
    settingsRef.current = settings;
  });

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  // The Surse tab has its own switch for site content: follow it, so a later save here doesn't
  // switch it back (unless it was changed here too and not saved yet: that change is kept).
  const lastSiteContent = useRef(settings.useSiteContent);
  useEffect(() => {
    const before = lastSiteContent.current;
    lastSiteContent.current = settings.useSiteContent;
    if (before === settings.useSiteContent) return;
    setBaseline((b) => ({ ...b, useSiteContent: settings.useSiteContent }));
    setForm((f) => (f.useSiteContent === before ? { ...f, useSiteContent: settings.useSiteContent } : f));
  }, [settings.useSiteContent]);

  // Restored changes are now in the form; forget the stashed copy.
  useEffect(() => dropDraft(DRAFT_KEY), []);

  // Session expired with unsaved changes: keep them in memory for after the new login (like the post editor).
  useEffect(
    () => () => {
      if (dirtyRef.current && isSessionLost()) stashDraft(DRAFT_KEY, formRef.current);
    },
    [],
  );

  // ---- unsaved-changes guard (same behaviour as the post editor) ----
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
      [],
    ),
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    setLeaveGuard(() => dirtyRef.current);
    return () => setLeaveGuard(null);
  }, [setLeaveGuard]);

  // ---- editing ----
  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key as FieldKey];
        return next;
      });
    }
  }

  const setSuggestions = (fn: (list: Suggestion[]) => Suggestion[]) => update("suggestions", fn(form.suggestions));

  // Focus moves after the list re-renders, in the same commit, so keys typed right away land in the right place.
  const pendingFocus = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    const focus = pendingFocus.current;
    pendingFocus.current = null;
    focus?.();
  });

  const focusSuggestion = (index: number) => {
    pendingFocus.current = () => {
      const inputs = document.querySelectorAll<HTMLInputElement>(`[data-suggestion="${uid}"]`);
      (inputs[Math.min(index, inputs.length - 1)] ?? document.getElementById(fid("add-suggestion")))?.focus();
    };
  };

  function addSuggestion() {
    setSuggestions((list) => [...list, suggestion("")]);
    focusSuggestion(form.suggestions.length);
  }

  function removeSuggestion(index: number) {
    setSuggestions((list) => list.filter((_, i) => i !== index));
    focusSuggestion(index);
  }

  function moveSuggestion(index: number, delta: -1 | 1) {
    setSuggestions((list) => {
      const next = [...list];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
    // Keep focus on the same arrow of the moved row, unless it just became disabled.
    pendingFocus.current = () => {
      const target = index + delta;
      const button = document.getElementById(fid(`move-${delta < 0 ? "up" : "down"}-${target}`)) as HTMLButtonElement | null;
      if (button && !button.disabled) button.focus();
      else document.getElementById(fid(`move-${delta < 0 ? "down" : "up"}-${target}`))?.focus();
    };
  }

  function focusFirstError(fields: Errors) {
    const first = FIELD_ORDER.find((k) => fields[k]);
    if (first) document.getElementById(fid(first))?.focus();
  }

  // ---- saving ----
  // A ref, not the `saving` state: two quick Ctrl+S presses run before React re-renders.
  const savingRef = useRef(false);
  async function save() {
    if (savingRef.current) return;
    const submitted = formRef.current;
    const problems = validate(submitted);
    setErrors(problems);
    if (Object.keys(problems).length) {
      setFormError("Setările nu au fost salvate: verificați câmpurile marcate.");
      focusFirstError(problems);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setFormError(null);
    const previous = settingsRef.current;
    try {
      const saved = await saveAiSettings(toSettings(submitted));
      const fresh = toForm(saved);
      setBaseline(fresh);
      // Keep anything typed while the request was in flight.
      setForm((current) => (sameForm(current, submitted) ? fresh : current));
      setErrors({});
      onSaved(saved, previous);
      // Without the OpenAI key the server does not start the sync.
      toast(
        saved.useSiteContent && !previous.useSiteContent && configured
          ? "Setările au fost salvate. Conținutul site-ului se sincronizează acum."
          : "Setările asistentului au fost salvate.",
      );
    } catch (err) {
      if (isUnauthorized(err)) return; // the layout sends us to login; changes are kept in memory
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        const fields: Errors = {};
        for (const key of FIELD_ORDER) if (err.fields[key]) fields[key] = err.fields[key];
        // A field this form has no input for (e.g. a newer server's check): its message goes in the summary.
        const other = Object.entries(err.fields)
          .filter(([key, message]) => message && !FIELD_ORDER.includes(key as FieldKey))
          .map(([, message]) => message);
        setErrors(fields);
        setFormError(
          other.length ? `Setările nu au fost salvate. ${other.join(" ")}` : "Setările nu au fost salvate: verificați câmpurile marcate.",
        );
        focusFirstError(fields);
      } else {
        setFormError(errorMessage(err, "Setările nu au putut fi salvate."));
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void save();
  }

  function discard() {
    setForm(baseline);
    setErrors({});
    setFormError(null);
  }

  // Ctrl/Cmd+S saves while this tab is shown, like in the post editor.
  const saveRef = useRef(save);
  useLayoutEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!document.querySelector("dialog[open]")) void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const filledSuggestions = form.suggestions.filter((s) => s.text.trim()).length;
  const suggestionsDescribedBy = [fid("suggestions-hint"), errors.suggestions ? fid("suggestions-error") : ""].filter(Boolean).join(" ");

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Setările asistentului">
      <div className="space-y-4 empty:hidden [&:not(:empty)]:mb-6">
        {/* Only while the restored changes are still unsaved (not after saving or discarding them). */}
        {initial.draft && dirty && (
          <Alert tone="info">
            Am restaurat modificările nesalvate dinaintea expirării sesiunii. Salvați setările pentru a le păstra.
          </Alert>
        )}
        {formError && <Alert tone="error">{formError}</Alert>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-6">
          <Card title="Fereastra de chat" titleId={fid("h-chat")}>
            <div className="space-y-6">
              <Field
                id={fid("welcome")}
                label="Mesaj de întâmpinare"
                error={errors.welcome}
                hint="Primul mesaj pe care îl vede vizitatorul când deschide asistentul."
                aside={
                  <span aria-hidden className="text-xs tabular-nums text-slate-500">
                    {form.welcome.length}/{WELCOME_MAX}
                  </span>
                }
              >
                <textarea
                  {...fieldAria(fid("welcome"), { hint: true, error: errors.welcome })}
                  value={form.welcome}
                  maxLength={WELCOME_MAX}
                  rows={3}
                  required
                  onChange={(e) => update("welcome", e.target.value)}
                  className={`${inputClass} resize-y`}
                />
              </Field>

              <fieldset
                id={fid("suggestions")}
                tabIndex={-1}
                aria-describedby={suggestionsDescribedBy}
                className="min-w-0 outline-none"
              >
                <legend className={`${labelClass} float-left flex w-full items-baseline justify-between gap-3`}>
                  <span>
                    Întrebări sugerate<span className="font-normal text-slate-500"> (opțional)</span>
                  </span>
                  <span aria-hidden className="text-xs font-normal tabular-nums text-slate-500">
                    {filledSuggestions}/{SUGGESTIONS_MAX}
                  </span>
                </legend>
                <p id={fid("suggestions-hint")} className="clear-both pt-1.5 text-xs leading-relaxed text-slate-500">
                  Apar ca butoane în fereastra de chat, înainte de prima întrebare. Maximum {SUGGESTIONS_MAX}, de cel mult{" "}
                  {SUGGESTION_MAX} de caractere fiecare; rândurile goale sunt ignorate.
                </p>
                {form.suggestions.length > 0 && (
                  <ol className="mt-3 space-y-2">
                    {form.suggestions.map((s, i) => (
                      <li key={s.key} className="flex items-center gap-1.5 sm:gap-2">
                        <span aria-hidden className="w-5 shrink-0 text-right text-xs font-medium tabular-nums text-slate-400">
                          {i + 1}.
                        </span>
                        <label htmlFor={fid(`suggestion-${s.key}`)} className="sr-only">
                          Întrebarea sugerată {i + 1}
                        </label>
                        <input
                          id={fid(`suggestion-${s.key}`)}
                          data-suggestion={uid}
                          type="text"
                          value={s.text}
                          maxLength={SUGGESTION_MAX}
                          placeholder="ex. Cât costă platforma eMIP?"
                          aria-invalid={errors.suggestions ? true : undefined}
                          onChange={(e) => {
                            const text = e.target.value;
                            setSuggestions((list) => list.map((x) => (x.key === s.key ? { ...x, text } : x)));
                          }}
                          className={`${inputClass} min-w-0 flex-1`}
                        />
                        <span className="flex shrink-0">
                          {/* Reordering is a desktop nicety; on a phone the row keeps its width for the text. */}
                          <span className="hidden sm:flex">
                            <IconButton
                              id={fid(`move-up-${i}`)}
                              label={`Mută mai sus întrebarea ${i + 1}`}
                              disabled={i === 0}
                              onClick={() => moveSuggestion(i, -1)}
                            >
                              <ArrowUp aria-hidden className="size-4" />
                            </IconButton>
                            <IconButton
                              id={fid(`move-down-${i}`)}
                              label={`Mută mai jos întrebarea ${i + 1}`}
                              disabled={i === form.suggestions.length - 1}
                              onClick={() => moveSuggestion(i, 1)}
                            >
                              <ArrowDown aria-hidden className="size-4" />
                            </IconButton>
                          </span>
                          <IconButton label={`Elimină întrebarea ${i + 1}`} danger onClick={() => removeSuggestion(i)}>
                            <X aria-hidden className="size-4" />
                          </IconButton>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                <Button
                  id={fid("add-suggestion")}
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  className="mt-3"
                  disabled={form.suggestions.length >= SUGGESTIONS_MAX}
                  onClick={addSuggestion}
                >
                  Adaugă o întrebare
                </Button>
                <FieldError id={fid("suggestions-error")} error={errors.suggestions} />
              </fieldset>
            </div>
          </Card>

          <Card title="Instrucțiuni suplimentare" titleId={fid("h-instructions")}>
            <Field
              id={fid("instructions")}
              label="Instrucțiuni pentru asistent"
              optional
              error={errors.instructions}
              hint="Se adaugă la regulile de bază ale asistentului (răspunde doar din surse, nu inventează prețuri sau termene, trimite spre pagina Contact). Scrieți reguli scurte, câte una pe rând, la imperativ."
              aside={
                <span aria-hidden className="text-xs tabular-nums text-slate-500">
                  {form.instructions.length}/{INSTRUCTIONS_MAX}
                </span>
              }
            >
              <textarea
                {...fieldAria(fid("instructions"), { hint: true, error: errors.instructions })}
                value={form.instructions}
                maxLength={INSTRUCTIONS_MAX}
                rows={7}
                onChange={(e) => update("instructions", e.target.value)}
                className={`${inputClass} resize-y`}
                placeholder="Nicio instrucțiune suplimentară."
              />
            </Field>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exemplu</p>
                {!form.instructions.trim() && (
                  <Button variant="ghost" size="sm" onClick={() => update("instructions", INSTRUCTIONS_EXAMPLE)}>
                    Folosește exemplul
                  </Button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{INSTRUCTIONS_EXAMPLE}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Disponibilitate" titleId={fid("h-availability")}>
            <div className="space-y-6">
              <Toggle
                id={fid("enabled")}
                checked={form.enabled}
                onChange={(v) => update("enabled", v)}
                label="Asistent activ pe site"
                hint={
                  configured
                    ? "Când este oprit, butonul „Întrebați asistentul” dispare de pe toate paginile."
                    : "Cheia OpenAI lipsește pe server: asistentul rămâne oprit indiferent de această setare."
                }
              />
              <Field
                id={fid("dailyLimit")}
                label="Limită zilnică de răspunsuri"
                error={errors.dailyLimit}
                hint={`Pentru toți vizitatorii împreună (protecție la costuri); 0 oprește răspunsurile. Azi: ${formatNumber(usageToday)}. Contorul repornește zilnic la 00:00 UTC (02:00–03:00, ora României).`}
              >
                <input
                  {...fieldAria(fid("dailyLimit"), { hint: true, error: errors.dailyLimit })}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={LIMIT_MAX}
                  step={1}
                  value={form.dailyLimit}
                  onChange={(e) => update("dailyLimit", e.target.value)}
                  className={`${inputClass} max-w-40 tabular-nums`}
                />
              </Field>
            </div>
          </Card>

          <Card title="Surse pentru răspunsuri" titleId={fid("h-sources")}>
            <Toggle
              id={fid("useSiteContent")}
              checked={form.useSiteContent}
              onChange={(v) => update("useSiteContent", v)}
              label="Folosește conținutul site-ului (pagini și articole)"
              hint="Dezactivat: asistentul răspunde doar din fișierele încărcate de dvs."
            />
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              {form.useSiteContent
                ? "Paginile site-ului și articolele publicate se sincronizează automat, împreună cu fișierele încărcate."
                : "Cât timp este dezactivat, sincronizarea automată a paginilor și articolelor este oprită; la reactivare, conținutul site-ului se sincronizează imediat."}
            </p>
            {!form.useSiteContent && readyUploads === 0 && (
              <Alert tone="warning" live className="mt-4">
                <p>
                  Niciun fișier încărcat nu este indexat, așa că asistentul <strong>nu va avea din ce să răspundă</strong>.
                </p>
                <button
                  type="button"
                  onClick={onOpenSources}
                  className="mt-1.5 font-semibold underline underline-offset-2 hover:text-amber-950"
                >
                  Încărcați fișiere în Surse
                </button>
              </Alert>
            )}
          </Card>

          <Card title="Confidențialitate" titleId={fid("h-privacy")}>
            <Toggle
              id={fid("log")}
              checked={form.logConversations}
              onChange={(v) => update("logConversations", v)}
              label="Salvează conversațiile"
              hint="Întrebările vizitatorilor și răspunsurile se păstrează 90 de zile, pentru revizuire în tabul Conversații."
            />
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Dacă păstrați conversațiile, politica de confidențialitate a site-ului trebuie să menționeze această stocare (și
              faptul că mesajele sunt procesate de OpenAI).{" "}
              <a
                href="/politica-de-confidentialitate"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 font-semibold text-navy-700 underline underline-offset-2 hover:text-navy-900"
              >
                Politica de confidențialitate
                <ExternalLink aria-hidden className="size-3" />
                <span className="sr-only">(se deschide într-o filă nouă)</span>
              </a>
            </p>
          </Card>
        </div>
      </div>

      {/* Save bar, always in reach at the bottom of the screen */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-slate-200 bg-slate-100/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-xs font-medium text-slate-600 sm:text-sm" role="status">
            {dirty ? (
              <span className="inline-flex items-center gap-1.5 text-amber-800">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-amber-500" /> Modificări nesalvate
              </span>
            ) : (
              "Toate modificările sunt salvate"
            )}
          </p>
          <div className="flex shrink-0 gap-2">
            {dirty && (
              <Button variant="ghost" icon={Undo2} disabled={saving} onClick={discard} aria-label="Renunță la modificări" title="Renunță la modificări">
                <span className="hidden sm:inline">Renunță la modificări</span>
              </Button>
            )}
            <Button type="submit" icon={Save} busy={saving}>
              Salvează setările
            </Button>
          </div>
        </div>
      </div>

      {/* Portal: this tab may be hidden (display: none) when the admin navigates away from another tab. */}
      {createPortal(
        <ConfirmDialog
          open={blocker.state === "blocked"}
          title="Părăsiți pagina fără să salvați?"
          description="Aveți modificări nesalvate în setările asistentului. Dacă părăsiți pagina, ele se pierd."
          confirmLabel="Părăsește pagina"
          cancelLabel="Rămân pe pagină"
          onConfirm={() => blocker.proceed?.()}
          onCancel={() => blocker.reset?.()}
        />,
        document.body,
      )}
    </form>
  );
}

function IconButton({
  id,
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  id?: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-950 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
        danger ? "hover:!bg-red-50 hover:!text-red-700" : ""
      }`}
    >
      {children}
    </button>
  );
}
