"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ToolResultCard } from "./ToolResultCard";
import { runAssistantTurn } from "@/lib/assistant/handlers";
import { useFocusTrap } from "@/components/ui/useFocusTrap";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: { name: string; result: unknown }[];
}

interface Props {
  onClose: () => void;
}

const STARTER =
  "Hi — I’m Beans. Ask me about the menu, hours, or hosting a party. I’ll look things up rather than guess.";

export function AssistantPanel({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: STARTER },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Really trap focus now — the comment used to claim this and only bound
  // Escape. Escape stays on window so it works even if focus has drifted out.
  useFocusTrap(panelRef, true, onClose);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);

    try {
      // Runs entirely client-side — Beans is a deterministic mock today, so no
      // server round-trip is needed (and the site ships as a static export).
      const data = await runAssistantTurn(
        next.map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, toolCalls: data.toolCalls },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Hm — I couldn’t reach the kitchen just now. Try again in a moment?",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label="Beans, the assistant"
      aria-modal="true"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="fixed bottom-0 right-0 z-[70] flex flex-col bg-qh-bg-elevated border border-qh-line shadow-lifted
                 w-full sm:w-[400px] sm:max-w-[calc(100vw-2.5rem)] h-[85dvh] max-h-[85dvh] sm:h-[600px] sm:max-h-[calc(100dvh-7rem)] sm:bottom-24 sm:right-5 sm:rounded-2xl"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-qh-line">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-full bg-qh-ink text-qh-bg inline-flex items-center justify-center text-sm">
            ☕
          </span>
          <div>
            <p className="font-display text-base leading-none">Beans</p>
            <p className="text-[11px] text-qh-ink-soft mt-0.5">
              🍪 remembers nothing about you between sessions
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="h-8 w-8 rounded-full hover:bg-qh-line/60 inline-flex items-center justify-center"
        >
          ✕
        </button>
      </header>

      {/* aria-live so a screen-reader user hears Beans reply instead of having
          to go hunting for new text that appeared silently. "polite" waits for
          a pause rather than interrupting whatever is being read. */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation with Beans"
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {busy && (
          <div className="flex gap-1.5 text-qh-ink-soft text-sm">
            <span className="font-mono">Beans is thinking</span>
            <Dots />
          </div>
        )}
      </div>

      <form
        onSubmit={send}
        className="border-t border-qh-line p-3 flex items-end gap-2"
      >
        <label htmlFor="beans-input" className="sr-only">
          Message Beans
        </label>
        <textarea
          id="beans-input"
          ref={inputRef}
          data-autofocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(e as unknown as FormEvent);
            }
          }}
          rows={1}
          placeholder="Ask about the menu, hours, or a booking…"
          className="flex-1 min-w-0 resize-none rounded-lg border border-qh-line bg-qh-bg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-qh-accent max-h-24 sm:max-h-32"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-qh-ink text-qh-bg px-3 py-2 text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const mine = message.role === "user";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          mine
            ? "bg-qh-ink text-qh-bg rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%] text-sm"
            : "bg-qh-bg rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[90%] text-sm border border-qh-line"
        }
      >
        {/* Plain text. This was dangerouslySetInnerHTML — including for the
            user's own messages, so anything typed into the box was parsed as
            markup and echoed back into the page. The only reason it existed
            was HTML entities in the canned replies; those are real Unicode
            characters now, so React can render them directly. */}
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.toolCalls?.map((tc, i) => (
          <ToolResultCard key={i} name={tc.name} result={tc.result} />
        ))}
      </div>
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-0.5">
      <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity }}>·</motion.span>
      <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>·</motion.span>
      <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}>·</motion.span>
    </span>
  );
}
