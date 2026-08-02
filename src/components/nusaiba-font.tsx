import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

export const nusaibaSans = Plus_Jakarta_Sans({
	variable: "--font-sans",
	subsets: ["latin"],
});

export const nusaibaMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

/** Apply on `<html>` — matches nusaiba.dev typography. */
export function nusaibaFontClassName() {
	return `${nusaibaSans.variable} ${nusaibaMono.variable}`;
}
