"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistant } from "./AssistantContext";

const AssistantPanel = dynamic(
  () => import("./AssistantPanel").then((m) => m.AssistantPanel),
  { ssr: false }
);

/**
 * Floating Beans button (always mounted) plus the lazily-loaded panel.
 * The panel JS only enters the bundle once the user clicks the button.
 *
 * Must be rendered inside an <AssistantProvider /> (in the root layout).
 */
export function AssistantWidget() {
  return (
    <>
      <FloatingButton />
      <PanelMount />
    </>
  );
}

function FloatingButton() {
  const { open, toggle } = useAssistant();
  const [bounce, setBounce] = useState(false);

  // Gentle bounce every 30 seconds while idle and closed.
  useEffect(() => {
    if (open) return;
    const id = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 700);
    }, 30_000);
    return () => clearInterval(id);
  }, [open]);

  return (
    <button
      type="button"
      aria-label={open ? "Close Beans" : "Open Beans, the assistant"}
      aria-expanded={open}
      onClick={toggle}
      className="fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full bg-qh-ink text-qh-bg shadow-lifted flex items-center justify-center transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-qh-accent"
    >
      <motion.span
        animate={bounce ? { y: [0, -8, 0] } : { y: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="text-xl"
        aria-hidden="true"
      >
        <BeanIcon />
      </motion.span>
    </button>
  );
}

function PanelMount() {
  const { open, setOpen } = useAssistant();
  return (
    <AnimatePresence>
      {open && <AssistantPanel onClose={() => setOpen(false)} />}
    </AnimatePresence>
  );
}

function BeanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <ellipse cx="12" cy="12" rx="7" ry="9" fill="currentColor" />
      <path d="M12 4 C 9 9, 9 15, 12 20" stroke="var(--qh-bg)" strokeWidth="1.4" fill="none" />
    </svg>
  );
}
