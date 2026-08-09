"use client";

import { bind, play } from "cuelume";
import { useEffect } from "react";

/**
 * Wires up cuelume's delegated listeners once, site-wide. bind() is
 * idempotent and covers elements added to the DOM later (route changes,
 * dialogs, etc.), so a single mount at the root is all this ever needs —
 * no per-page re-binding.
 *
 * Also observes the DOM for new sonner toasts and plays a matching cue
 * (success → success, error → error). This is intentionally decoupled
 * from the toast() call sites — every existing `toast.success` /
 * `toast.error` gets a sound without touching a single import.
 */
export function CuelumeBind() {
  useEffect(() => {
    bind();

    // Watch the whole body for newly-inserted sonner toast elements. The
    // Sonner library renders each toast as a <li data-sonner-toast
    // data-type="..."> — we key the sound off that data-type. A per-toast
    // guard on data-cue-played prevents re-firing on style updates.
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const toasts =
            node.matches?.("[data-sonner-toast]")
              ? [node]
              : Array.from(
                  node.querySelectorAll?.("[data-sonner-toast]") ?? [],
                );
          for (const t of toasts) {
            if (!(t instanceof HTMLElement)) continue;
            if (t.dataset.cuePlayed === "true") continue;
            t.dataset.cuePlayed = "true";
            const type = t.getAttribute("data-type");
            if (type === "success") play("success");
            else if (type === "error") play("error");
            else play("chime");
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
