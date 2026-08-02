"use client";

import { useEffect } from "react";

/**
 * Watches the URL for a ?ref=CODE query parameter and drops it into a
 * long-lived cookie. Rendered at the root layout so it works whether the
 * user lands on /, /waitlist, or any deep link. The cookie is later
 * consumed on first sign-in to persist referred_by on user_preferences.
 *
 * Kept as a mount-once effect with no state — nothing to unmount, no
 * re-renders, safe to render in a server-rendered layout.
 */
export function ReferralCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (!ref) return;
      // 90-day cookie — enough time to spread a link and have someone
      // actually sign up, without keeping stale attribution forever
      const maxAge = 60 * 60 * 24 * 90;
      document.cookie = `rf_ref=${encodeURIComponent(ref)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch {
      // localStorage / cookie access can throw in some embedded webviews —
      // referral tracking is a nice-to-have, never let it break the page
    }
  }, []);
  return null;
}
