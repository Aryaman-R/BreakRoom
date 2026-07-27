"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

// Presentational on-screen keyboard for kiosk mode. All value/caret work is
// delegated to the parent through onKey — this component only renders keys,
// tracks shift and the alpha/symbols layer, and repeats backspace on hold.
// KioskKeyboard remounts it (React key) per focused field so state resets.

export type KeyAction =
  | { type: "insert"; text: string }
  | { type: "backspace" }
  | { type: "enter" }
  | { type: "hide" };

export type KeyboardIntent = {
  layout: "alpha" | "phone" | "numeric" | "decimal";
  /** Show @ and .com convenience keys (email fields). */
  email?: boolean;
  /** Textarea: Enter inserts a newline instead of dismissing. */
  multiline?: boolean;
  /** Start with one-shot shift on (empty non-password text fields). */
  startShifted?: boolean;
};

type ShiftState = "off" | "once" | "locked";

type KeyDef = {
  id: string;
  label: string;
  onPress: "insert" | "backspace" | "enter" | "hide" | "shift" | "symbols" | "abc";
  /** Text to insert; defaults to label. */
  text?: string;
  /** Relative width; keys use flex-grow with basis 0. */
  grow?: number;
  /** "mode" is the ?123/ABC layer switch — filled so it reads as a mode. */
  variant?: "char" | "action" | "mode";
  /** Render a glyph instead of the label. */
  icon?: "hide";
  /** Repeat while held (backspace). */
  repeat?: boolean;
  aria?: string;
};

// Keyboard-with-down-arrow, the standard "put the keyboard away" glyph.
function HideIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="3.5" width="19" height="11.5" rx="2.5" />
      <path d="M6 7h.01M9.5 7h.01M13 7h.01M16.5 7h.01M6 11h.01M18 11h.01M9.5 11h5" />
      <path d="M9 18.5l3 3 3-3" />
    </svg>
  );
}

const key = (label: string, opts: Partial<KeyDef> = {}): KeyDef => ({
  id: opts.id ?? label,
  label,
  onPress: "insert",
  variant: "char",
  ...opts,
});

const chars = (s: string): KeyDef[] => s.split("").map((c) => key(c));

const backspaceKey = (grow = 1.4): KeyDef =>
  key("⌫", { onPress: "backspace", variant: "action", grow, repeat: true, aria: "Backspace" });

// Hides the keyboard only — it never blurs the field or submits anything, so
// the sheet you're typing in stays open and your place is kept.
const hideKey = (grow = 1.6): KeyDef =>
  key("", { id: "hide", onPress: "hide", variant: "action", icon: "hide", grow, aria: "Hide keyboard" });

function bottomRow(layer: "alpha" | "symbols", intent: KeyboardIntent): KeyDef[] {
  const row: KeyDef[] = [
    layer === "alpha"
      ? key("?123", { onPress: "symbols", variant: "mode", grow: 1.6, aria: "Numbers and symbols" })
      : key("ABC", { onPress: "abc", variant: "mode", grow: 1.6, aria: "Letters" }),
  ];
  if (intent.email && layer === "alpha") {
    row.push(key("@"), key("space", { id: "space", text: " ", grow: 2.6, aria: "Space" }), key(".com"), key("."));
  } else {
    row.push(key(","), key("space", { id: "space", text: " ", grow: 4, aria: "Space" }), key("."));
  }
  if (intent.multiline) {
    row.push(key("↵", { onPress: "enter", variant: "action", text: "\n", aria: "New line" }));
  }
  row.push(hideKey());
  return row;
}

function alphaRows(shifted: boolean, intent: KeyboardIntent): KeyDef[][] {
  // aria-label stays the stable lowercase letter across shift states.
  const letters = (s: string) =>
    s.split("").map((c) => key(shifted ? c.toUpperCase() : c, { id: c, aria: c }));
  return [
    letters("qwertyuiop"),
    letters("asdfghjkl"),
    [
      key("⇧", { onPress: "shift", variant: "action", grow: 1.4, aria: "Shift" }),
      ...letters("zxcvbnm"),
      backspaceKey(),
    ],
    bottomRow("alpha", intent),
  ];
}

function symbolRows(intent: KeyboardIntent): KeyDef[][] {
  return [
    chars("1234567890"),
    chars("@#$%&-+()/"),
    [...["*", '"', "'", ":", ";", "!", "?", "_", "="].map((c) => key(c)), backspaceKey()],
    bottomRow("symbols", intent),
  ];
}

const PHONE_ROWS: KeyDef[][] = [
  [key("1"), key("2"), key("3"), backspaceKey(1)],
  [key("4"), key("5"), key("6"), key("+")],
  [key("7"), key("8"), key("9"), key("-")],
  [key("("), key("0"), key(")"), hideKey(1)],
];

const NUMERIC_ROWS: KeyDef[][] = [
  [key("1"), key("2"), key("3")],
  [key("4"), key("5"), key("6")],
  [key("7"), key("8"), key("9")],
  [backspaceKey(1), key("0"), hideKey(1)],
];

const DECIMAL_ROWS: KeyDef[][] = [
  [key("1"), key("2"), key("3"), backspaceKey(1)],
  [key("4"), key("5"), key("6"), key("-")],
  [key("7"), key("8"), key("9"), key(".")],
  [key("0", { grow: 3.1 }), hideKey(1)],
];

export function VirtualKeyboard({
  intent,
  onKey,
  containerRef,
}: {
  intent: KeyboardIntent;
  onKey: (action: KeyAction) => void;
  containerRef?: React.RefCallback<HTMLDivElement> | React.MutableRefObject<HTMLDivElement | null>;
}) {
  const [shift, setShift] = useState<ShiftState>(intent.startShifted ? "once" : "off");
  const [layer, setLayer] = useState<"alpha" | "symbols">("alpha");
  const repeat = useRef<{ delay?: number; interval?: number }>({});

  const stopRepeat = () => {
    window.clearTimeout(repeat.current.delay);
    window.clearInterval(repeat.current.interval);
  };
  useEffect(() => stopRepeat, []);

  const shifted = shift !== "off";
  const rows =
    intent.layout === "alpha"
      ? layer === "alpha"
        ? alphaRows(shifted, intent)
        : symbolRows(intent)
      : intent.layout === "phone"
        ? PHONE_ROWS
        : intent.layout === "numeric"
          ? NUMERIC_ROWS
          : DECIMAL_ROWS;

  const press = (k: KeyDef) => {
    switch (k.onPress) {
      case "insert":
        onKey({ type: "insert", text: k.text ?? k.label });
        // One-shot shift releases after a letter, like a phone keyboard.
        if (shift === "once" && /^[a-z]$/i.test(k.id)) setShift("off");
        break;
      case "backspace":
        onKey({ type: "backspace" });
        break;
      case "enter":
        onKey({ type: "enter" });
        break;
      case "hide":
        onKey({ type: "hide" });
        break;
      case "shift":
        setShift((s) => (s === "off" ? "once" : s === "once" ? "locked" : "off"));
        break;
      case "symbols":
        setLayer("symbols");
        break;
      case "abc":
        setLayer("alpha");
        break;
    }
  };

  const startPress = (k: KeyDef) => {
    press(k);
    if (k.repeat) {
      stopRepeat();
      repeat.current.delay = window.setTimeout(() => {
        repeat.current.interval = window.setInterval(() => press(k), 55);
      }, 500);
    }
  };

  const compact = intent.layout !== "alpha";

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Kiosk keyboard"
      className="fixed inset-x-0 bottom-0 z-[70] select-none border-t border-qh-line bg-qh-bg-elevated/95 shadow-lifted backdrop-blur [touch-action:manipulation]"
      // Keep focus in the input: cancel mousedown/touch focus for the whole
      // keyboard, including gaps between keys.
      onPointerDown={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={clsx(
          "mx-auto w-full space-y-1.5 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          compact ? "max-w-sm" : "max-w-2xl"
        )}
      >
        {rows.map((row, i) => (
          <div
            key={i}
            className={clsx(
              "flex gap-1.5",
              // Indent the home row like a real keyboard.
              !compact && layer === "alpha" && i === 1 && "px-[4.5%]"
            )}
          >
            {row.map((k) => {
              // Hiding the keyboard unmounts it, so it must happen on pointerup,
              // never pointerdown: unmounting mid-gesture lets the follow-up
              // click hit-test through to the page underneath and press
              // whatever now sits there (it used to close the open sheet).
              const hides = k.onPress === "hide";
              return (
                <button
                  key={k.id}
                  type="button"
                  tabIndex={-1}
                  aria-label={k.aria ?? k.label}
                  aria-pressed={k.onPress === "shift" ? shift !== "off" : undefined}
                  style={{ flexGrow: k.grow ?? 1, flexBasis: 0 }}
                  className={clsx(
                    "flex h-12 min-w-0 items-center justify-center rounded-lg border transition-colors duration-75 sm:h-14",
                    k.label.length > 1 && k.variant === "char" ? "text-sm" : "text-lg",
                    k.variant === "mode"
                      ? "border-qh-sage bg-qh-sage font-medium text-white active:brightness-125"
                      : k.variant === "action"
                        ? clsx(
                            "border-qh-sage/45 bg-qh-line font-medium text-qh-ink active:bg-qh-accent-soft",
                            k.onPress === "shift" &&
                              shift !== "off" &&
                              "border-qh-sage bg-qh-sage/30"
                          )
                        : "border-qh-line bg-white text-qh-ink active:bg-qh-accent-soft"
                  )}
                  onPointerDown={hides ? undefined : () => startPress(k)}
                  onPointerUp={hides ? () => press(k) : k.repeat ? stopRepeat : undefined}
                  onPointerLeave={k.repeat ? stopRepeat : undefined}
                  onPointerCancel={k.repeat ? stopRepeat : undefined}
                >
                  {k.icon === "hide" ? (
                    <HideIcon />
                  ) : k.onPress === "shift" ? (
                    shift === "locked" ? (
                      "⇪"
                    ) : (
                      "⇧"
                    )
                  ) : (
                    k.label
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
