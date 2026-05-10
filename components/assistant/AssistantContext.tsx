"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AssistantContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open, setOpen, toggle: () => setOpen((v) => !v) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAssistant must be used inside <AssistantProvider />");
  return ctx;
}
