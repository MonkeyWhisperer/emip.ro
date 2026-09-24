import type { ContactInput, NewsletterInput } from "../../shared/forms";
import { apiFetch } from "./api";

export type { ContactInput, NewsletterInput };

// Submissions are stored by the server and listed in the admin panel (Mesaje).
// Field errors come back as ApiError.fields (name, email, message, consent).

export const sendContactMessage = (input: ContactInput) =>
  apiFetch<{ ok: true }>("/forms/contact", { method: "POST", json: input });

export const subscribeToNewsletter = (input: NewsletterInput) =>
  apiFetch<{ ok: true }>("/forms/newsletter", { method: "POST", json: input });
