import type { ChatConfig, ChatEvent, ChatMessage, ChatSource } from "../../shared/ai";
import { ApiError, apiFetch } from "./api";

export type { ChatConfig, ChatMessage, ChatSource };

export const fetchChatConfig = () => apiFetch<ChatConfig>("/chat/config");

type StreamHandlers = {
  onDelta: (text: string) => void;
  onSources?: (sources: ChatSource[]) => void;
};

/**
 * Sends the conversation to POST /api/chat and consumes its server-sent events.
 * Resolves when the answer is complete; rejects with ApiError (e.g. 429 limits) or Error.
 */
export async function streamChat(
  body: { messages: ChatMessage[]; page: string; sessionId: string },
  handlers: StreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new ApiError(res.status, (await res.json().catch(() => null)) ?? {});
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    // SSE frames are separated by a blank line; each has "event:" and "data:" lines.
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = frame
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trimStart())
        .join("\n");
      if (!data) continue;
      const event = JSON.parse(data) as ChatEvent;
      if (event.type === "delta") handlers.onDelta(event.text);
      else if (event.type === "sources") handlers.onSources?.(event.sources);
      else if (event.type === "error") throw new Error(event.message);
      else if (event.type === "done") return;
    }
  }
}
