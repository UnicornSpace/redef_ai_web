import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = NOINDEX_METADATA;

export default function ChallengePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Challenge Page</h1>
            <p className="mt-4 text-lg">This is the challenge page content.</p>
        </div>
    );
}