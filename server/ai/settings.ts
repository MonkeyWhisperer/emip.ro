import type { AiSettings } from "../../shared/ai.ts";
import { getMeta, setMeta } from "../db.ts";
import { ValidationError, objectBody } from "../validate.ts";

// Assistant settings, edited in Admin → Asistent AI → Setări and stored as JSON in the meta table.

const DEFAULT_SETTINGS: AiSettings = {
  enabled: true,
  welcome:
    "Bună ziua! Sunt asistentul virtual eMIP. Vă pot ajuta cu informații despre platformă, prețuri, servicii și proiectele cu finanțare. Cu ce vă pot ajuta?",
  suggestions: ["Ce este platforma eMIP?", "Cât costă eMIP?", "Cum generez rapoartele MIPE?", "Ce este eMIP Arch?"],
  useSiteContent: true,
  instructions: "",
  dailyLimit: 1000,
  logConversations: true,
};

export function getSettings(): AiSettings {
  const raw = getMeta("ai_settings");
  return { ...DEFAULT_SETTINGS, ...(raw ? (JSON.parse(raw) as Partial<AiSettings>) : {}) };
}

export function saveSettings(raw: unknown): AiSettings {
  const current = getSettings();
  const body = objectBody(raw);
  const fields: Record<string, string> = {};
  const welcome = typeof body.welcome === "string" ? body.welcome.trim() : "";
  if (!welcome || welcome.length > 500) fields.welcome = "Mesajul de întâmpinare este obligatoriu (max. 500 de caractere).";
  const suggestions = Array.isArray(body.suggestions)
    ? body.suggestions.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean)
    : [];
  if (suggestions.length > 6 || suggestions.some((s) => s.length > 120)) fields.suggestions = "Maximum 6 sugestii, de cel mult 120 de caractere.";
  const instructions = typeof body.instructions === "string" ? body.instructions.trim() : "";
  if (instructions.length > 4000) fields.instructions = "Instrucțiunile pot avea cel mult 4000 de caractere.";
  const dailyLimit = Number(body.dailyLimit);
  if (!Number.isInteger(dailyLimit) || dailyLimit < 0 || dailyLimit > 100_000) fields.dailyLimit = "Limita zilnică trebuie să fie un număr între 0 și 100000.";
  if (Object.keys(fields).length) throw new ValidationError(fields);

  const settings: AiSettings = {
    enabled: body.enabled === true,
    welcome,
    suggestions,
    // Older clients that don't send the field keep the current value.
    useSiteContent: typeof body.useSiteContent === "boolean" ? body.useSiteContent : current.useSiteContent,
    instructions,
    dailyLimit,
    logConversations: body.logConversations === true,
  };
  setMeta("ai_settings", JSON.stringify(settings));
  return settings;
}
