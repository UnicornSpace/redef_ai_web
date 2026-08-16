/**
 * Shared Inter font registration for @react-pdf/renderer documents.
 * Font.register uses global state inside react-pdf, so every PDF document
 * in the app should call this one guarded helper rather than each
 * re-registering the same family — calling it twice in one process is
 * harmless but wasteful, and this keeps the font file paths in one place.
 */

import path from "node:path";
import { Font } from "@react-pdf/renderer";

let fontsReady = false;

export function ensurePdfFonts(): void {
  if (fontsReady) return;
  const dir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(dir, "Inter-Regular.woff"), fontWeight: "normal" },
      { src: path.join(dir, "Inter-Medium.woff"), fontWeight: "medium" },
      { src: path.join(dir, "Inter-SemiBold.woff"), fontWeight: "semibold" },
      { src: path.join(dir, "Inter-Bold.woff"), fontWeight: "bold" },
    ],
  });
  // Labels/short lines; never hyphenate-split them.
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}
