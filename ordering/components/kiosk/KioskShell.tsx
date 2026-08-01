"use client";

import { KioskExit } from "./KioskExit";
import { KioskIdle } from "./KioskIdle";
import { KioskKeyboard } from "./KioskKeyboard";
import { KioskOffline } from "./KioskOffline";

// Every kiosk overlay, mounted once beside the app in app/layout.tsx. Each
// one renders nothing at all unless this device is in kiosk mode, so a
// normal visit pays for four cheap no-ops and nothing else.
//
// Stacking order (z-index) is the contract between them:
//   70  on-screen keyboard   — under any dialog it might be typing into
//   75  idle "still there?"  — over the app, under the reasons to abandon it
//   80  attract screen       — rendered by OrderApp; owns the whole screen
//   85  out-of-service       — outranks attract: don't invite an order we
//                              can't take
//   90  staff exit hotspot   — must be tappable through every one of them
//   95  staff PIN pad
export function KioskShell() {
  return (
    <>
      <KioskOffline />
      <KioskIdle />
      <KioskExit />
      <KioskKeyboard />
    </>
  );
}
