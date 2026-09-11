"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RECAP } from "./recap-theme";

/**
 * Full-screen story player: segmented progress along the top, tap the left
 * or right third to step, swipe on touch, arrow keys / Escape on desktop.
 *
 * Deliberately NOT auto-advancing on a timer. Instagram's recap can afford
 * to because it's passive entertainment; here each slide is the user's own
 * data with numbers worth reading, and a slide yanked away mid-read is
 * worse than one that waits. The segments still show position, they just
 * fill on arrival rather than draining on a clock.
 */
export function StoryPlayer({
  slides,
  onClose,
  footer,
}: {
  slides: ReactNode[];
  onClose: () => void;
  footer?: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  // +1 forward, -1 back — drives which way the slide animates in.
  const [dir, setDir] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (next: number) => {
      if (next < 0) return;
      if (next >= count) {
        onClose();
        return;
      }
      setDir(next > index ? 1 : -1);
      setIndex(next);
    },
    [count, index, onClose],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, onClose]);

  // The player owns the whole viewport, so stop the page underneath from
  // scrolling behind it while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center"
      style={{ background: RECAP.bg, color: RECAP.text }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(dx) < 40) return;
        go(dx < 0 ? index + 1 : index - 1);
      }}
    >
      {/* Story column. Capped near phone width so the deck keeps its
          proportions on a desktop monitor instead of stretching a
          portrait format across 1400px. */}
      <div className="flex h-full w-full max-w-[440px] flex-col">
        {/* progress segments */}
        <div className="flex shrink-0 gap-1 px-3 pt-3">
          {slides.map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length slide track
              key={i}
              className="h-[3px] flex-1 overflow-hidden rounded-full"
              style={{ background: RECAP.line }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: RECAP.text }}
                initial={false}
                animate={{ width: i <= index ? "100%" : "0%" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>

        <div className="flex shrink-0 justify-end px-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recap"
            className="rounded-full p-3 transition-opacity hover:opacity-70"
          >
            <X size={24} />
          </button>
        </div>

        {/* slide */}
        <div className="relative min-h-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="absolute inset-0 overflow-y-auto px-6 pb-6"
            >
              {slides[index]}
            </motion.div>
          </AnimatePresence>

          {/* tap zones sit above the slide but below any real control, and
            are skipped by the keyboard since arrows already do this. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => go(index - 1)}
            className="absolute inset-y-0 left-0 w-1/3 cursor-default focus:outline-none"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => go(index + 1)}
            className="absolute inset-y-0 right-0 w-1/3 cursor-default focus:outline-none"
          />
        </div>

        {footer ? <div className="shrink-0 px-6 pb-6">{footer}</div> : null}
      </div>
    </div>
  );
}
