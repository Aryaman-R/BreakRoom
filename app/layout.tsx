import type { Metadata, Viewport } from "next";
import { Squada_One, DM_Sans, JetBrains_Mono, Bagel_Fat_One } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { ModeProvider } from "@/components/ModeProvider";
import { AssistantProvider } from "@/components/assistant/AssistantContext";
import { BUSINESS, SITE_URL } from "@/lib/business";
import { localBusinessJsonLd, websiteJsonLd } from "@/lib/structured-data";

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
  // Falls back to the production origin, never localhost. With output:"export"
  // this is inlined at build time and there is no runtime to re-resolve it, so
  // a localhost fallback shipped `http://localhost:3000/...` as the og:image on
  // every page and every shared link previewed as a broken image.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Breakroom — Coffee, Boba & Comfort Food in Bothell, WA",
    template: "%s — The Breakroom",
  },
  description: BUSINESS.description,
  applicationName: BUSINESS.name,
  keywords: [
    "cafe Bothell",
    "coffee shop Bothell WA",
    "bubble tea Bothell",
    "boba Bothell",
    "North Creek Parkway cafe",
    "lunch Bothell",
    "catering Bothell",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "The Breakroom — Coffee, Boba & Comfort Food in Bothell, WA",
    description:
      "Coffee, boba, and comfort food in Bothell, WA — plus private events and catering.",
    type: "website",
    url: SITE_URL,
    siteName: BUSINESS.name,
    locale: "en_US",
    images: [
      {
        // 1200x630 is the minimum for a large summary card; the previous
        // 640x480 rendered as a small square thumbnail on every platform.
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Inside The Breakroom — the lounge with sofas and big windows.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Breakroom — Coffee, Boba & Comfort Food in Bothell, WA",
    description:
      "Coffee, boba, and comfort food in Bothell, WA — plus private events and catering.",
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
      <head>
        {/* Tells Google this is a cafe in Bothell with these hours and this
            phone number, rather than making it infer them from prose. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([localBusinessJsonLd(), websiteJsonLd()]),
          }}
        />
      </head>
      <body>
        {/*
          Paints /book dark on the very first frame.

          ModeProvider sets data-mode in an effect, which does not run until
          React hydrates. Until then <body> had no data-mode, so /book rendered
          with the light theme's variables — cream text on a pale background,
          unreadable, for as long as hydration took. This runs synchronously
          during parsing, before the browser paints, and ModeProvider still
          owns it for every client-side navigation afterwards.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.body.dataset.mode=location.pathname.indexOf("/book")===0?"after-hours":"quiet-hours";`,
          }}
        />
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
