import type { Metadata } from "next";
import { Squada_One, DM_Sans, JetBrains_Mono, Bagel_Fat_One } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { ModeProvider } from "@/components/ModeProvider";
import { AssistantProvider } from "@/components/assistant/AssistantContext";

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
    default: "The Breakroom",
    template: "%s — The Breakroom",
  },
  description:
    "A Bothell café for specialty coffee, bubble tea, and Asian-American comfort food — dine in by day, private events and catering by night.",
  openGraph: {
    title: "The Breakroom",
    description:
      "Coffee, boba, and comfort food in Bothell, WA — plus private events and catering.",
    type: "website",
    images: [
      {
        url: "/photos/lounge-wide.jpg",
        width: 640,
        height: 480,
        alt: "Inside The Breakroom — the lounge with sofas and big windows.",
      },
    ],
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
      className={`${squadaOne.variable} ${dmSans.variable} ${jetbrains.variable} ${bagel.variable}`}
    >
      <body>
        <ModeProvider>
          <AssistantProvider>
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
          </AssistantProvider>
        </ModeProvider>
      </body>
    </html>
  );
}
