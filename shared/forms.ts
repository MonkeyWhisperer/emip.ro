// Public form submissions (contact form, newsletter sign-up), shared by server and web app.

export type SubmissionKind = "contact" | "newsletter";

export type ContactInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  /** Must be true: the visitor agreed to the privacy policy. */
  consent: boolean;
  /** Honeypot field; real visitors leave it empty. */
  website?: string;
};

export type NewsletterInput = {
  email: string;
  consent: boolean;
  website?: string;
};

export type Submission = {
  id: number;
  kind: SubmissionKind;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string | null;
  read: boolean;
  /** ISO timestamp (UTC). */
  createdAt: string;
};
