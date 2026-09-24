// Keeps the post editor's unsaved changes in memory (never in storage) when the
// session expires mid-edit, so they can be restored after logging in again.

let sessionLost = false;
const drafts = new Map<string, unknown>();

/** Called by the admin layout when an admin call answers 401. */
export function markSessionLost() {
  sessionLost = true;
}

export const isSessionLost = () => sessionLost;

/** Called after a successful login. */
export function clearSessionLost() {
  sessionLost = false;
}

export function stashDraft(key: string, draft: unknown) {
  drafts.set(key, draft);
}

export const peekDraft = <T,>(key: string) => drafts.get(key) as T | undefined;

export function dropDraft(key: string) {
  drafts.delete(key);
}
