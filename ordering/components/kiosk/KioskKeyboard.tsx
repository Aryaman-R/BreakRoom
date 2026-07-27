"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  applyBackspace,
  applyInsert,
  KIOSK_STORAGE_KEY,
  parseKioskValue,
} from "@/lib/kiosk";
import {
  VirtualKeyboard,
  type KeyAction,
  type KeyboardIntent,
} from "./VirtualKeyboard";

// Kiosk-only on-screen keyboard, mounted once in app/layout.tsx.
//
// Activation is owner-only and invisible to regular visitors: opening
// ?kiosk=on once on the kiosk device stores a localStorage flag that keeps it
// on across reloads; ?kiosk=off clears it. While a text field is focused the
// keyboard docks to the bottom, publishes its height as --kiosk-kb-h and adds
// .kiosk-kb-open to <html> (see globals.css), so page content and Sheet
// dialogs make room instead of being covered; anything still overlapped is
// scrolled into view.

type Editable = HTMLInputElement | HTMLTextAreaElement;

// Input types the keyboard can meaningfully type into. Pickers (time, date),
// toggles, and buttons keep their native widgets.
const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "tel",
  "url",
  "email",
  "password",
  "number",
]);

function editableFrom(node: unknown): Editable | null {
  if (node instanceof HTMLTextAreaElement) {
    return node.readOnly || node.disabled || node.dataset.kioskIgnore != null ? null : node;
  }
  if (node instanceof HTMLInputElement) {
    if (!TEXT_INPUT_TYPES.has(node.type)) return null;
    return node.readOnly || node.disabled || node.dataset.kioskIgnore != null ? null : node;
  }
  return null;
}

// The kiosk should never pop the device's own on-screen keyboard on top of
// ours. Stash the original inputmode (it drives our layout choice), then
// force "none". Runs on pointerdown-capture so it lands before focus.
function suppressNativeKeyboard(el: Editable) {
  if (el.dataset.kioskInputmode === undefined) {
    el.dataset.kioskInputmode = el.getAttribute("inputmode") ?? "";
  }
  if (el.getAttribute("inputmode") !== "none") {
    el.setAttribute("inputmode", "none");
  }
}

function intentFor(el: Editable): KeyboardIntent {
  if (el instanceof HTMLTextAreaElement) {
    return { layout: "alpha", multiline: true, startShifted: el.value.length === 0 };
  }
  const stored = el.dataset.kioskInputmode;
  const raw = (stored || el.getAttribute("inputmode") || "").toLowerCase();
  const mode = raw === "none" ? "" : raw;
  if (el.type === "tel" || mode === "tel") return { layout: "phone" };
  if (el.type === "number" || mode === "decimal") return { layout: "decimal" };
  if (mode === "numeric") return { layout: "numeric" };
  if (el.type === "email" || mode === "email") return { layout: "alpha", email: true };
  return {
    layout: "alpha",
    startShifted: el.type !== "password" && el.value.length === 0,
  };
}

function readSelection(el: Editable): { start: number | null; end: number | null } {
  // selectionStart throws or is null on types like email — lib/kiosk.ts
  // treats null as "caret at end".
  try {
    return { start: el.selectionStart, end: el.selectionEnd };
  } catch {
    return { start: null, end: null };
  }
}

// Assign through the prototype setter and fire a bubbling input event so
// React's controlled inputs see the change as if the user typed it.
function setNativeValue(el: Editable, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

// Scroll just enough that the focused field sits above the keyboard: nearest
// scrollable ancestors first (e.g. a Sheet panel), then the window.
function revealAboveKeyboard(el: HTMLElement, keyboardTop: number) {
  const MARGIN = 16;
  const rect = el.getBoundingClientRect();
  let overflow = rect.bottom - (keyboardTop - MARGIN);
  // Never push the field's top off-screen (tall textareas).
  overflow = Math.min(overflow, Math.max(0, rect.top - MARGIN));
  if (overflow <= 0) return;
  let node: HTMLElement | null = el.parentElement;
  while (node && overflow > 1) {
    if (node.scrollHeight > node.clientHeight + 1) {
      const { overflowY } = getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll") {
        const before = node.scrollTop;
        node.scrollTop = before + overflow;
        overflow -= node.scrollTop - before;
      }
    }
    node = node.parentElement;
  }
  if (overflow > 1) window.scrollBy(0, overflow);
}

function KioskKeyboardManager() {
  const searchParams = useSearchParams();
  const [enabled, setEnabled] = useState(false);
  const [target, setTarget] = useState<Editable | null>(null);
  // Bumped per focused field so the keyboard remounts with fresh shift/layer.
  const [targetGen, setTargetGen] = useState(0);
  const targetRef = useRef<Editable | null>(null);
  const kbRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);

  // ?kiosk=on|off updates the sticky flag; everyone else never sees any of
  // this because the flag simply isn't set on their device.
  useEffect(() => {
    let on = false;
    try {
      const change = parseKioskValue(searchParams.get("kiosk"));
      if (change === "on") localStorage.setItem(KIOSK_STORAGE_KEY, "1");
      if (change === "off") localStorage.removeItem(KIOSK_STORAGE_KEY);
      on = localStorage.getItem(KIOSK_STORAGE_KEY) === "1";
    } catch {
      // Storage unavailable (privacy mode) — kiosk mode stays off.
    }
    setEnabled(on);
  }, [searchParams]);

  const retarget = useCallback((el: Editable | null) => {
    if (targetRef.current === el) return;
    targetRef.current = el;
    setTarget(el);
    setTargetGen((g) => g + 1);
  }, []);

  // Track which editable field has focus.
  useEffect(() => {
    if (!enabled) return;
    const onFocusIn = (e: FocusEvent) => {
      const el = editableFrom(e.target);
      if (el) {
        suppressNativeKeyboard(el);
        retarget(el);
      }
    };
    const onFocusOut = () => {
      // Defer: focus may be moving straight to another field.
      window.setTimeout(() => retarget(editableFrom(document.activeElement)), 0);
    };
    const onPointerDown = (e: PointerEvent) => {
      // Before focus lands, so the native keyboard never flashes.
      const el = editableFrom(e.target);
      if (el) suppressNativeKeyboard(el);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerdown", onPointerDown, true);
    const current = editableFrom(document.activeElement);
    if (current) {
      suppressNativeKeyboard(current);
      retarget(current);
    }
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerdown", onPointerDown, true);
      retarget(null);
    };
  }, [enabled, retarget]);

  // Safety net: fields can vanish without focus events (sheet closed, field
  // disabled mid-flow, node removed). Cheap poll keeps state honest.
  useEffect(() => {
    if (!target) return;
    const iv = window.setInterval(() => {
      const el = targetRef.current;
      if (!el || !el.isConnected || document.activeElement !== el) {
        retarget(editableFrom(document.activeElement));
      }
    }, 400);
    return () => window.clearInterval(iv);
  }, [target, retarget]);

  const ensureVisibleSoon = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    // Double rAF: let the padding from --kiosk-kb-h land before measuring.
    rafRef.current = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = targetRef.current;
        const kb = kbRef.current;
        if (!el || !kb || !el.isConnected) return;
        revealAboveKeyboard(el, kb.getBoundingClientRect().top);
      })
    );
  }, []);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Publish keyboard height while visible so the page makes room under it.
  useEffect(() => {
    if (!target) return;
    const root = document.documentElement;
    root.classList.add("kiosk-kb-open");
    const sync = () => {
      root.style.setProperty("--kiosk-kb-h", `${kbRef.current?.offsetHeight ?? 0}px`);
      ensureVisibleSoon();
    };
    sync();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    if (kbRef.current && ro) ro.observe(kbRef.current);
    window.addEventListener("resize", sync);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", sync);
      root.classList.remove("kiosk-kb-open");
      root.style.setProperty("--kiosk-kb-h", "0px");
    };
  }, [target, targetGen, ensureVisibleSoon]);

  const handleKey = useCallback(
    (action: KeyAction) => {
      const el = targetRef.current;
      if (!el || !el.isConnected) return;
      if (document.activeElement !== el) el.focus({ preventScroll: true });
      if (action.type === "done") {
        el.blur();
        return;
      }
      if (action.type === "enter" && !(el instanceof HTMLTextAreaElement)) {
        el.blur();
        return;
      }
      const text =
        action.type === "backspace" ? null : action.type === "enter" ? "\n" : action.text;
      const sel = readSelection(el);
      const result =
        text == null
          ? applyBackspace(el.value, sel.start, sel.end)
          : applyInsert(el.value, sel.start, sel.end, text, el.maxLength);
      if (result.value !== el.value) {
        setNativeValue(el, result.value);
        try {
          el.setSelectionRange(result.caret, result.caret);
        } catch {
          // Selection not supported on this input type — caret stays at end.
        }
      }
      ensureVisibleSoon();
    },
    [ensureVisibleSoon]
  );

  if (!enabled || !target) return null;
  return (
    <VirtualKeyboard
      key={targetGen}
      intent={intentFor(target)}
      onKey={handleKey}
      containerRef={kbRef}
    />
  );
}

export function KioskKeyboard() {
  // useSearchParams needs a Suspense boundary to keep pages statically
  // renderable; the keyboard is client-only either way.
  return (
    <Suspense fallback={null}>
      <KioskKeyboardManager />
    </Suspense>
  );
}
