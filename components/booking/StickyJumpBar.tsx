"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Mobile-only sticky bar: pins to the bottom of the viewport once the user
 * scrolls past the hero, with a single CTA "Jump to form ↓".
 */
export function StickyJumpBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        >
          <div className="ml-3 mr-3 mb-3 rounded-full pl-3 pr-20 py-2 flex items-center justify-between gap-3 bg-ah-cream text-ah-bg shadow-lifted"
               style={{
                 backgroundImage:
                   "linear-gradient(90deg, #FF3D8A 0%, #FF8C42 30%, #FFE066 55%, #6EE7B7 80%, #A78BFA 100%)",
               }}
          >
            <span className="text-xs font-medium pl-2 text-ah-bg">Ready when you are</span>
            <a
              href="#form"
              className="rounded-full bg-ah-bg text-ah-cream px-4 py-2 text-xs font-medium"
            >
              Jump to form ↓
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
