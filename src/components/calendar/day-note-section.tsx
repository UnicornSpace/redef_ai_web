"use client";

import { Check, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveDayNote } from "@/actions/day-notes";
import { Button } from "@/components/ui/button";
import { DictationTextarea } from "@/components/ui/dictation-textarea";
import type { DayNoteSource } from "@/lib/types/day-notes";

/**
 * The free-text note for one calendar day — the place for whatever the
 * modules do not model ("sister visited", "migraine all afternoon").
 *
 * Saves explicitly rather than on a debounce: this dialog can be dismissed
 * by clicking outside it, and a half-typed sentence silently persisting on
 * dismissal is worse than a visible Save. The button is the only thing
 * that writes.
 */
export function DayNoteSection({
  date,
  initialContent,
  initialSource,
}: {
  date: string;
  initialContent: string;
  initialSource: DayNoteSource | null;
}) {
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = content.trim() !== savedContent.trim();

  function handleSave() {
    const next = content;
    startTransition(async () => {
      const res = await saveDayNote(date, next, "manual");
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setSavedContent(next);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold uppercase tracking-wide text-body-muted">
          Note
        </h4>
        {initialSource === "ai" && !dirty ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-g-green-pale px-2 py-0.5 text-xs font-semibold text-rf-green-deep">
            <Sparkles size={11} />
            From your assistant
          </span>
        ) : null}
      </div>

      <DictationTextarea
        value={content}
        onValueChange={setContent}
        disabled={pending}
        aria-label="Note for this day"
        placeholder="What happened today? Anything the other sections don't capture…"
        hint={dirty ? "Unsaved" : undefined}
      />

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          loading={pending}
          disabled={pending || !dirty}
        >
          {justSaved && !dirty ? (
            <>
              <Check />
              Saved
            </>
          ) : (
            "Save note"
          )}
        </Button>
      </div>
    </div>
  );
}
