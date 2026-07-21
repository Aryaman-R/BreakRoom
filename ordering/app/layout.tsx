import type { Metadata, Viewport } from "next";
import { Squada_One, DM_Sans, JetBrains_Mono } from "next/font/google";
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
      <body>{children}</body>
    </html>
  );
}
