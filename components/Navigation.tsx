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
  { href: "/visit", label: "Visit" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
];

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
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
      <div className="container-page flex items-center justify-between h-[68px] gap-6">
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

        <div className="flex items-center gap-3">
          <AssistantTrigger dark={dark} />
          <div className="hidden sm:block">
            <BookPartyButton size="md" />
          </div>
          {/* Mobile shrunken variant — never collapses into hamburger */}
          <div className="sm:hidden">
            <BookPartyButton size="sm" />
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

      <AnimatePresence>
        {mobileOpen && <MobileSheet pathname={pathname} dark={dark} />}
      </AnimatePresence>
    </header>
  );
}

function Wordmark() {
  return (
    <Link
      href="/"
      // Inherits color from the nav header — no need to hard-code here.
      className="group flex items-center gap-2.5"
      aria-label="The Breakroom — home"
    >
      {/* Logo has a solid (white) background, so keep it in a self-contained
          rounded tile that reads intentionally on both light and dark nav. */}
      <span className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white shadow-soft ring-1 ring-qh-ink/10 overflow-hidden shrink-0">
        <Image src="/logo-mark.png" alt="" width={32} height={28} className="h-5 sm:h-6 w-auto" />
      </span>
      <span className="font-display text-2xl tracking-tightish">
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

function MobileSheet({ pathname, dark }: { pathname: string; dark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "md:hidden fixed inset-0 top-[68px] z-40 overflow-y-auto overscroll-contain",
        dark ? "bg-ah-bg" : "bg-qh-bg"
      )}
    >
      <nav className="container-page flex flex-col py-6 sm:py-10 gap-1 sm:gap-2">
        {TABS.map((tab, i) => {
          const active = pathname.startsWith(tab.href);
          return (
            <motion.div
              key={tab.href}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
            >
              <Link
                href={tab.href}
                className={clsx(
                  "block py-4 font-display text-3xl tracking-tightish border-b",
                  dark ? "border-ah-cream/15" : "border-qh-line",
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
    </motion.div>
  );
}
