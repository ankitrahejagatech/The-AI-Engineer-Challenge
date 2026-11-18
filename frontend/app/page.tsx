"use client";

/**
 * Pocket Coach — chat UI
 *
 * Talks to the FastAPI backend through two same-origin endpoints:
 *   - GET  /api/health  -> { status: "ok" }          (connection indicator)
 *   - POST /api/chat    -> { reply: string }          (body: { message: string })
 *
 * In production on Vercel, `/api/*` is routed to the Python function by
 * vercel.json. In local dev, next.config.ts rewrites `/api/*` to the FastAPI
 * server on http://localhost:8000, so the browser always uses relative URLs.
 *
 * NOTE: the backend accepts only a single `message` per request (it uses a
 * fixed system prompt and does not take conversation history), so each send
 * transmits just the latest message. The running transcript below is kept in
 * the browser purely for display.
 */

import { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

interface Message {
  id: number;
  role: Role;
  content: string;
}

type Health = "checking" | "online" | "offline";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health>("checking");

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(0);
  const nextId = () => (idRef.current += 1);

  // Ping the backend once on mount so we can show whether it's reachable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!cancelled) {
          setHealth(res.ok && data?.status === "ok" ? "online" : "offline");
        }
      } catch {
        if (!cancelled) setHealth("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  // Let the input box grow to fit its contents (capped) instead of scrolling.
  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    setMessages((m) => [...m, { id: nextId(), role: "user", content: text }]);
    setInput("");
    setSending(true);
    // Reset the textarea height after clearing it.
    requestAnimationFrame(autoGrow);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const detail = data?.detail ?? `Request failed (${res.status})`;
        throw new Error(
          typeof detail === "string" ? detail : JSON.stringify(detail),
        );
      }

      setMessages((m) => [
        ...m,
        { id: nextId(), role: "assistant", content: data?.reply ?? "(no reply)" },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong reaching the backend.",
      );
    } finally {
      setSending(false);
    }
  }

  // Enter sends; Shift+Enter inserts a newline.
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <div className="flex h-dvh w-full max-w-2xl flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-lg">
              🧭
            </span>
            <div>
              <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Pocket Coach
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                A supportive AI companion
              </p>
            </div>
          </div>
          <HealthBadge health={health} />
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-6"
        >
          {messages.length === 0 && !sending ? (
            <EmptyState onPick={(q) => setInput(q)} />
          ) : (
            messages.map((m) => <Bubble key={m.id} message={m} />)
          )}

          {sending && <TypingIndicator />}

          {error && (
            <div
              role="alert"
              className="mx-auto max-w-md rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            >
              <span className="font-medium">Couldn&apos;t send that:</span>{" "}
              {error}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={sendMessage}
          className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-300 bg-white px-3 py-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoGrow();
              }}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Share what's on your mind…"
              className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            Enter to send · Shift + Enter for a new line
          </p>
        </form>
      </div>
    </div>
  );
}

function HealthBadge({ health }: { health: Health }) {
  const map = {
    checking: {
      dot: "bg-amber-400",
      label: "Connecting…",
      text: "text-amber-700 dark:text-amber-300",
    },
    online: {
      dot: "bg-emerald-500",
      label: "Backend online",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    offline: {
      dot: "bg-red-500",
      label: "Backend offline",
      text: "text-red-700 dark:text-red-300",
    },
  } as const;
  const s = map[health];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-indigo-600 text-white"
            : "rounded-bl-sm border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500"
      style={{ animationDelay: delay }}
    />
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const prompts = [
    "I'm feeling overwhelmed at work.",
    "Help me set a goal for this week.",
    "How can I build a better morning routine?",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-1">
        <p className="text-2xl">👋</p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          How can I support you today?
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Start the conversation, or try one of these:
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-left text-sm text-zinc-700 transition hover:border-indigo-400 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500 dark:hover:bg-zinc-800"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
