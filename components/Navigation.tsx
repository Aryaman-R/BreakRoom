"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { BookPartyButton } from "./BookPartyButton";
import { AssistantTrigger } from "./assistant/AssistantTrigger";
import { useNavBackdrop } from "./useNavBackdrop";
import clsx from "clsx";

const TABS = [
  { href: "/menu", label: "Menu" },
  { href: "/online-order", label: "Online Order" },
  { href: "/visit", label: "Visit" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
];

// DoorDash storefront — shared between the desktop nav button and the mobile drawer.
const ORDER_URL =
  "https://www.doordash.com/store/the-breakroom-bothell-45695059/111526546/?cursor=eyJzZWFyY2hfaXRlbV9jYXJvdXNlbF9jdXJzb3IiOnsicXVlcnkiOiJUaGUgQnJlYWtyb29tIiwiaXRlbV9pZHMiOltdLCJzZWFyY2hfdGVybSI6InRoZSBicmVha3Jvb20iLCJ2ZXJ0aWNhbF9pZCI6LTk5OSwidmVydGljYWxfbmFtZSI6ImFsbCIsInF1ZXJ5X2ludGVudCI6IlNUT1JFX1JYIn0sInN0b3JlX3ByaW1hcnlfdmVydGljYWxfaWRzIjpbMSwxMTAwMzcsMTEwMDQ1LDExMDA1MiwxMTAwNTUsMTEwMDYyLDRdfQ==&pickup=false";

export function Navigation() {
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // /book is always Mode B (dark); other pages flip to "light on dark" only
  // when a section marked data-nav-backdrop="dark" is behind the nav.
  const overDarkSection = useNavBackdrop();
  const onAfterHoursRoute = pathname.startsWith("/book");
  const dark = onAfterHoursRoute || overDarkSection;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll + allow Escape to close while the mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <header
      data-dark={dark || undefined}
      className={clsx(
        "sticky top-0 z-50 transition-colors duration-500 backdrop-blur-md",
        // Backdrop tint depends on both scroll state and what's behind us
        scrolled
          ? dark
            ? "bg-ah-bg/55 border-b border-ah-cream/10"
            : "bg-qh-bg/75 border-b border-qh-line"
          : "bg-transparent border-b border-transparent",
        // Foreground color flows through children via currentColor
        dark ? "text-ah-cream" : "text-qh-ink"
      )}
    >
      <div className="container-page flex items-center justify-between h-[68px] gap-2 sm:gap-6">
        <Wordmark />

        <LayoutGroup id="nav-tabs">
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={clsx(
                    "relative px-3 py-2 text-sm transition-colors",
                    dark
                      ? "text-ah-cream/70 hover:text-ah-cream"
                      : "text-qh-ink-soft hover:text-qh-ink"
                  )}
                >
                  <span className="relative z-[1]">{tab.label}</span>
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className={clsx(
                        "absolute left-2 right-2 -bottom-0.5 h-[2px] rounded-full",
                        dark ? "bg-ah-electric" : "bg-qh-accent"
                      )}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </LayoutGroup>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <AssistantTrigger dark={dark} />

          <Link
            href={ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
    "hidden sm:inline-flex items-center justify-center px-5 py-3.5 rounded-full text-sm font-medium transition-colors", "bg-ah-electric text-black hover:bg-ah-electric/90", "bg-qh-accent text-white hover:bg-qh-accent/90"
  )}
          >
          Order
          </Link>

          <div className="hidden sm:block">
            <BookPartyButton size="md" />
          </div>
          {/* Mobile shrunken variant — never collapses into hamburger */}
          <div className="sm:hidden">
            <BookPartyButton size="sm" label="Book" />
          </div>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className={clsx(
              "md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              dark
                ? "hover:bg-ah-cream/10 text-ah-cream"
                : "hover:bg-qh-line/60 text-qh-ink"
            )}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      <MobileDrawer
        open={mobileOpen}
        pathname={pathname}
        dark={dark}
        onClose={() => setMobileOpen(false)}
      />
    </header>
  );
}

function Wordmark() {
  return (
    <Link
      href="/"
      // Inherits color from the nav header — no need to hard-code here.
      className="group flex items-center gap-2 sm:gap-2.5 min-w-0"
      aria-label="The Breakroom — home"
    >
      {/* Logo has a solid (white) background, so keep it in a self-contained
          rounded tile that reads intentionally on both light and dark nav. */}
      <span className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white shadow-soft ring-1 ring-qh-ink/10 overflow-hidden shrink-0">
        <Image src="/logo-mark.png" alt="" width={32} height={28} className="h-5 sm:h-6 w-auto" />
      </span>
      <span className="font-display italic text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-tightish truncate">
        The Breakroom
        <span className="inline-block transition-transform duration-300 group-hover:rotate-12 group-hover:translate-x-0.5">
          .
        </span>
      </span>
    </Link>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <motion.line
        x1="3" x2="19"
        animate={{ y1: open ? 11 : 7, y2: open ? 11 : 7, rotate: open ? 45 : 0 }}
        style={{ originX: "11px", originY: "11px" }}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      />
      <motion.line
        x1="3" x2="19" y1="15" y2="15"
        animate={{ y1: open ? 11 : 15, y2: open ? 11 : 15, rotate: open ? -45 : 0 }}
        style={{ originX: "11px", originY: "11px" }}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      />
    </svg>
  );
}

function MobileDrawer({
  open,
  pathname,
  dark,
  onClose,
}: {
  open: boolean;
  pathname: string;
  dark: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && [
        // Dimmed backdrop — tap to close.
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          aria-hidden="true"
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />,
        // Slide-in sidebar from the right.
        <motion.aside
          key="drawer"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 40 }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={clsx(
            "md:hidden fixed right-0 top-0 bottom-0 z-50 flex w-[80%] max-w-xs flex-col overflow-y-auto overscroll-contain shadow-2xl",
            dark ? "bg-ah-bg text-ah-cream" : "bg-qh-bg text-qh-ink"
          )}
        >
          <div
            className={clsx(
              "flex items-center justify-between h-[68px] px-5 border-b",
              dark ? "border-ah-cream/10" : "border-qh-line"
            )}
          >
            <span className="font-display italic text-xl tracking-tightish">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className={clsx(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                dark ? "hover:bg-ah-cream/10" : "hover:bg-qh-line/60"
              )}
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="flex flex-col px-5 py-4">
            {TABS.map((tab, i) => {
              const active = pathname.startsWith(tab.href);
              return (
                <motion.div
                  key={tab.href}
                  initial={{ x: 16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: "easeOut" }}
                >
                  <Link
                    href={tab.href}
                    onClick={onClose}
                    className={clsx(
                      "block py-4 font-display text-2xl tracking-tightish border-b",
                      dark ? "border-ah-cream/12" : "border-qh-line",
                      active
                        ? dark
                          ? "italic text-ah-electric"
                          : "italic text-qh-accent"
                        : dark
                        ? "text-ah-cream"
                        : "text-qh-ink"
                    )}
                  >
                    {tab.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="mt-auto px-5 pb-8 pt-4 flex flex-col gap-3">
            <Link
              href={ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className={clsx(
                "inline-flex items-center justify-center px-5 py-3.5 rounded-full text-sm font-medium transition-colors",
                dark
                  ? "bg-ah-electric text-black hover:bg-ah-electric/90"
                  : "bg-qh-accent text-white hover:bg-qh-accent/90"
              )}
            >
              Order on DoorDash ↗
            </Link>
          </div>
        </motion.aside>,
      ]}
    </AnimatePresence>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <line x1="5" y1="5" x2="17" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17" y1="5" x2="5" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
