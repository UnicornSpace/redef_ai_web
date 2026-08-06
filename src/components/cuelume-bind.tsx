"use client";

import { bind } from "cuelume";
import { useEffect } from "react";

/**
 * Wires up cuelume's delegated listeners once, site-wide. bind() is
 * idempotent and covers elements added to the DOM later (route changes,
 * dialogs, etc.), so a single mount at the root is all this ever needs —
 * no per-page re-binding.
 */
export function CuelumeBind() {
  useEffect(() => {
    bind();
  }, []);
  return null;
}
