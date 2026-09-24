// AI assistant types shared by the server (server/ai/) and the web app.

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export type ChatRequest = {
  messages: ChatMessage[];
  /** Path of the page the visitor is on, e.g. "/preturi". Ignored unless it is a known route of the site. */
  page?: string;
  /** Random id kept for the browser session; groups messages in the conversation log. */
  sessionId?: string;
};

export type ChatSource = { title: string; url: string | null };

/** Server-sent events emitted by POST /api/chat. */
export type ChatEvent =
  | { type: "delta"; text: string }
  | { type: "sources"; sources: ChatSource[] }
  | { type: "done" }
  | { type: "error"; message: string };

export type ChatConfig = {
  enabled: boolean;
  welcome: string;
  suggestions: string[];
};

export type AiSettings = ChatConfig & {
  /**
   * Whether answers may use the site's own pages and blog posts. When false the assistant
   * searches only the training files uploaded in the admin panel.
   */
  useSiteContent: boolean;
  /** Extra instructions appended to the built-in system prompt. */
  instructions: string;
  /** Maximum assistant replies per day across all visitors (cost guard). */
  dailyLimit: number;
  /** Store questions and answers for review in the admin panel (kept 90 days). */
  logConversations: boolean;
};

export type AiSourceKind = "upload" | "page" | "post";
export type AiSourceStatus = "pending" | "processing" | "ready" | "failed";

export type AiSource = {
  id: number;
  kind: AiSourceKind;
  title: string;
  url: string | null;
  filename: string;
  bytes: number;
  status: AiSourceStatus;
  error: string | null;
  updatedAt: string;
};

export type AiStatus = {
  /** False when OPENAI_API_KEY is missing: the assistant is off regardless of settings. */
  configured: boolean;
  model: string;
  settings: AiSettings;
  sources: AiSource[];
  lastSiteSync: { at: string; pages: number; posts: number; error?: string } | null;
  siteSyncRunning: boolean;
  usageToday: number;
  /** Tokens (input + output) used today (UTC) by all visitors together. */
  tokensToday?: number;
  /** Site-wide daily token budget (AI_DAILY_TOKEN_LIMIT); answers stop when it is reached. */
  dailyTokenLimit?: number;
};

/** One question and the assistant's answer. */
export type AiConversationTurn = {
  id: number;
  /** Page the visitor was on when asking. */
  page: string | null;
  question: string;
  answer: string;
  sources: ChatSource[];
  createdAt: string;
};

/**
 * One visitor conversation: every turn sent with the same chat session id (the chat panel
 * starts a new one on "Conversație nouă" or in a new browser tab). Turns are oldest first.
 */
export type AiConversation = {
  /**
   * Session id, or "single:<turn id>" for turns logged without one. Used to delete the
   * conversation: DELETE /api/admin/ai/conversations/${encodeURIComponent(id)}.
   */
  id: string;
  startedAt: string;
  updatedAt: string;
  turnCount: number;
  turns: AiConversationTurn[];
};

export type AiConversationPage = { total: number; conversations: AiConversation[] };
