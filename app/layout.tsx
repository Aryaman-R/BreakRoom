import type { Metadata } from "next";
import { Fraunces, DM_Sans, JetBrains_Mono, Bagel_Fat_One } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { ModeProvider } from "@/components/ModeProvider";
import { AssistantProvider } from "@/components/assistant/AssistantContext";
import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/cart/CartDrawer";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["SOFT", "WONK", "opsz"],
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

const bagel = Bagel_Fat_One({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-party",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "The Break Room",
    template: "%s — The Break Room",
  },
  description:
    "By day, a calm cafe for office workers. By night, an electric event space for parties and gatherings.",
  openGraph: {
    title: "The Break Room",
    description:
      "Somewhere between the office and home — a quiet workspace by day, an event space by night.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${jetbrains.variable} ${bagel.variable}`}
    >
      <body>
        <ModeProvider>
          <AssistantProvider>
            <CartProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-qh-ink focus:text-qh-bg focus:px-3 focus:py-2 focus:rounded-md"
              >
                Skip to content
              </a>
              <Navigation />
              <main id="main" className="relative z-[2]">
                {children}
              </main>
              <Footer />
              <AssistantWidget />
              <CartDrawer />
            </CartProvider>
          </AssistantProvider>
        </ModeProvider>
      </body>
    </html>
  );
}
