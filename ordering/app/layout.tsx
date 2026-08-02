import type { Metadata, Viewport } from "next";
import { Squada_One, DM_Sans, JetBrains_Mono } from "next/font/google";
import { KioskProvider } from "@/components/kiosk/KioskProvider";
import { KioskShell } from "@/components/kiosk/KioskShell";
import "./globals.css";

const squadaOne = Squada_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Order Ahead — The Breakroom",
    template: "%s — The Breakroom",
  },
  description:
    "Order ahead from The Breakroom in Bothell, WA. Pay at the register when you pick up — no fees, no apps.",
};

export const viewport: Viewport = {
  themeColor: "#eaf1dc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${squadaOne.variable} ${dmSans.variable} ${jetbrains.variable}`}
    >
      <body>
        {/*
          Applies the kiosk restyle before the first paint.

          KioskProvider owns kiosk mode, but it can only read the localStorage
          flag in an effect — after hydration. Until then the document had no
          `kiosk` class, so a counter screen painted the phone-sized public UI
          and then jumped to arm's-length touch sizing once React caught up.
          This runs synchronously during parsing and sets the same class the
          provider's effect does, so the two agree and the jump is gone.

          Deliberately duplicates KIOSK_STORAGE_KEY: an inline script cannot
          import. If that constant ever changes, change it here too — the
          comment in lib/kiosk.ts says why it is frozen.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `try{if(localStorage.getItem("br-kiosk-keyboard")==="1")` +
              `document.documentElement.classList.add("kiosk")}catch(e){}`,
          }}
        />
        <KioskProvider>
          {children}
          <KioskShell />
        </KioskProvider>
      </body>
    </html>
  );
}
