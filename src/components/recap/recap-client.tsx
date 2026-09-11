"use client";

import { ChevronRight, Flame, Play, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { WeeklyReportData } from "@/lib/types/reports";
import { cn } from "@/lib/utils";
import { buildRecapSlides } from "./recap-slides";
import { RECAP_ACCENTS } from "./recap-theme";
import { StoryPlayer } from "./story-player";

/**
 * The recap index — the "Latest / Previous" list from the reference — plus
 * the player it opens into.
 *
 * Today there is exactly one recap to show (the current week), because
 * weekly_report_snapshots only started being written recently and nothing
 * aggregates them by month yet. The list is built to take more rows the
 * moment history exists, rather than being a single hardcoded card that
 * has to be rewritten then.
 */
export interface RecapEntry {
  id: string;
  title: string;
  subtitle: string | null;
  report: WeeklyReportData;
  isNew?: boolean;
  streakDays?: number;
}

function RecapRow({
  entry,
  onOpen,
}: {
  entry: RecapEntry;
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl bg-paper p-3 text-left",
        "shadow-[0_0_0_1px_rgba(55,50,47,0.06),0_1px_2px_-1px_rgba(55,50,47,0.06)]",
        "transition-[box-shadow,transform] duration-150 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(55,50,47,0.1),0_4px_10px_-2px_rgba(55,50,47,0.1)]",
        "active:scale-[0.99]",
      )}
    >
      {/* Thumbnail. The reference uses the user's own media here; this app
          has no imagery of its own, so the cover is a branded gradient
          rather than a grey placeholder pretending a photo is missing. */}
      <span
        aria-hidden="true"
        className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        // Hex, not var() — these custom properties are scoped to `.redef`
        // in redef-theme.css, so an inline var() reference resolves to
        // nothing (and renders a blank tile) anywhere outside that scope.
        style={{
          background: `linear-gradient(135deg, ${RECAP_ACCENTS.green} 0%, ${RECAP_ACCENTS.violet} 100%)`,
        }}
      >
        <Play size={20} className="text-white" fill="currentColor" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold text-ink">
          {entry.title}
        </span>
        {entry.subtitle ? (
          <span className="truncate text-xs text-body-muted">
            {entry.subtitle}
          </span>
        ) : null}
      </span>

      {entry.streakDays && entry.streakDays > 1 ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-g-green-pale px-2.5 py-1 text-xs font-bold text-rf-green-deep">
          <Flame size={12} />
          {entry.streakDays}d
        </span>
      ) : entry.isNew ? (
        <span className="shrink-0 rounded-full bg-g-green-pale px-2.5 py-1 text-xs font-bold text-rf-green-deep">
          New
        </span>
      ) : null}

      <ChevronRight
        size={18}
        className="shrink-0 text-body-muted transition-transform group-hover:translate-x-0.5"
      />
    </motion.button>
  );
}

export function RecapClient({ entries }: { entries: RecapEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = entries.find((e) => e.id === openId) ?? null;

  if (entries.length === 0) {
    return (
      <div className="mx-4 flex flex-col gap-1 rounded-2xl border border-dashed border-line bg-paper/40 px-6 py-10 text-center md:mx-8">
        <p className="text-sm font-semibold text-ink">No recap yet.</p>
        <p className="text-sm text-body-muted">
          Turn on a module — Habits, Tasks, Deep Work, or Personal Finance — and
          your first recap builds as you use it.
        </p>
      </div>
    );
  }

  const [latest, ...previous] = entries;

  return (
    <>
      <div className="flex flex-col gap-6 px-4 pb-16 md:px-8">
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-body-muted">
            Latest
          </h2>
          <RecapRow entry={latest} onOpen={() => setOpenId(latest.id)} />
        </section>

        {previous.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-body-muted">
              Previous
            </h2>
            <div className="flex flex-col gap-2">
              {previous.map((e) => (
                <RecapRow key={e.id} entry={e} onOpen={() => setOpenId(e.id)} />
              ))}
            </div>
          </section>
        ) : (
          <p className="flex items-start gap-2 px-1 text-xs text-body-muted">
            <Sparkles size={14} className="mt-0.5 shrink-0" />
            <span>
              Past recaps collect here as the weeks go by — one lands every
              Sunday.
            </span>
          </p>
        )}
      </div>

      {open ? (
        <StoryPlayer
          slides={buildRecapSlides(open.report)}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}
