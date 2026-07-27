// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { KIOSK_STORAGE_KEY } from "../lib/kiosk";
import { KioskKeyboard } from "../components/kiosk/KioskKeyboard";

// The keyboard only reads the ?kiosk= param; nothing else from the router.
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

// A stand-in for Sheet: a full-screen backdrop button that closes the dialog,
// with the panel on top. This is the shape that made the bug bite — tapping
// "hide" left a click on the backdrop, which closed the dialog mid-typing.
function Dialog({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <button data-testid="backdrop" aria-label="Close" onClick={onClose} />
      <label htmlFor="notes">Notes</label>
      <textarea id="notes" data-testid="notes" defaultValue="no onions" />
      <KioskKeyboard />
    </div>
  );
}

const HIDE_AT = { clientX: 400, clientY: 700 };

function focusNotes() {
  const notes = screen.getByTestId("notes") as HTMLTextAreaElement;
  // focus() dispatches focusin natively, which is what the keyboard listens
  // for — act() so the resulting state update is flushed before we assert.
  act(() => notes.focus());
  return notes;
}

function tapHide() {
  const hide = screen.getByLabelText("Hide keyboard");
  fireEvent.pointerDown(hide, HIDE_AT);
  fireEvent.pointerUp(hide, HIDE_AT);
}

describe("kiosk keyboard — hiding must not disturb the page", () => {
  beforeEach(() => {
    localStorage.setItem(KIOSK_STORAGE_KEY, "1");
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.useRealTimers();
  });

  it("shows the keyboard when a field is focused", () => {
    render(<Dialog onClose={() => {}} />);
    focusNotes();
    expect(screen.getByLabelText("Hide keyboard")).toBeTruthy();
  });

  it("hides the keyboard without blurring the field or losing its text", () => {
    render(<Dialog onClose={() => {}} />);
    const notes = focusNotes();
    tapHide();

    expect(screen.queryByLabelText("Hide keyboard")).toBeNull();
    // The whole point: focus, caret and content survive, so the dialog the
    // user is typing in keeps its state.
    expect(document.activeElement).toBe(notes);
    expect(notes.value).toBe("no onions");
  });

  it("swallows the compatibility click touch fires after the keyboard is gone", () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    focusNotes();
    tapHide();

    // The browser hit-tests this click against the DOM as it stands now, so it
    // lands on the backdrop that the keyboard was covering a moment ago.
    fireEvent.click(screen.getByTestId("backdrop"), HIDE_AT);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("still lets a real tap elsewhere close the dialog", () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    focusNotes();
    tapHide();

    // Far from where the finger lifted — a deliberate tap, not the ghost.
    fireEvent.click(screen.getByTestId("backdrop"), { clientX: 40, clientY: 60 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stops swallowing once the ghost-click window has passed", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    focusNotes();
    tapHide();
    vi.advanceTimersByTime(600);

    fireEvent.click(screen.getByTestId("backdrop"), HIDE_AT);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("brings the keyboard back when the still-focused field is tapped again", () => {
    render(<Dialog onClose={() => {}} />);
    const notes = focusNotes();
    tapHide();
    expect(screen.queryByLabelText("Hide keyboard")).toBeNull();

    // No focus event fires here — the field never lost focus — so this relies
    // on the pointerdown listener rather than on refocusing.
    fireEvent.pointerDown(notes, { clientX: 200, clientY: 200 });
    expect(screen.getByLabelText("Hide keyboard")).toBeTruthy();
  });

  it("stays out of the way entirely when kiosk mode is off", () => {
    localStorage.clear();
    render(<Dialog onClose={() => {}} />);
    focusNotes();
    expect(screen.queryByLabelText("Hide keyboard")).toBeNull();
  });
});
