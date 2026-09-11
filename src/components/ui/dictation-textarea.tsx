"use client";

import { MicIcon, SquareIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { useLiveTranscription } from "@/hooks/use-live-transcription";
import { cn } from "@/lib/utils";

/**
 * Textarea with push-to-talk dictation.
 *
 * Transcribed text lands at the CARET, not at the end — if you click into
 * the middle of a sentence and start talking, that is where you expect the
 * words to go. After inserting we restore the caret to the end of the new
 * text so a second phrase continues from the first rather than jumping
 * back.
 *
 * The mic hides itself where the Web Speech API is unavailable (Firefox,
 * and Safari before 14.1) instead of offering a button that does nothing.
 */
export function DictationTextarea({
  value,
  onValueChange,
  placeholder,
  hint,
  className,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (next: string) => void;
  placeholder?: string;
  /** Small caption in the toolbar, e.g. a character count or tip. */
  hint?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // The caret can only be read while the textarea has focus; pressing the
  // mic button moves focus to the button, so capture the position on the
  // way out and insert there.
  const caretRef = useRef<number | null>(null);
  // onFinal fires from a recognition callback that closed over whatever
  // `value` was when listening started, so reading the prop there would
  // append to a stale string and drop earlier phrases. Mirror it in a ref.
  const valueRef = useRef(value);
  valueRef.current = value;

  const insertAtCaret = useCallback(
    (text: string) => {
      const current = valueRef.current;
      const at = caretRef.current ?? current.length;
      const before = current.slice(0, at);
      const after = current.slice(at);

      // Space the insertion against its neighbours without doubling up on
      // whitespace that is already there.
      const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
      const needsTrailingSpace = after.length > 0 && !/^\s/.test(after);
      const chunk = `${needsLeadingSpace ? " " : ""}${text}${
        needsTrailingSpace ? " " : ""
      }`;

      const next = before + chunk + after;
      const caretAfter = (before + chunk).length;
      caretRef.current = caretAfter;
      onValueChange(next);

      // Put the visible caret back where the text ended, once React has
      // committed the new value.
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(caretAfter, caretAfter);
      });
    },
    [onValueChange],
  );

  const { supported, isListening, start, stop } = useLiveTranscription({
    onFinal: insertAtCaret,
  });

  function rememberCaret() {
    const el = textareaRef.current;
    if (el) caretRef.current = el.selectionStart;
  }

  return (
    <InputGroup className={className}>
      <InputGroupTextarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => onValueChange(e.target.value)}
        onSelect={rememberCaret}
        onKeyUp={rememberCaret}
        onClick={rememberCaret}
        onBlur={rememberCaret}
      />
      <InputGroupAddon align="block-end">
        {supported ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  aria-label={isListening ? "Stop dictation" : "Dictate note"}
                  aria-pressed={isListening}
                  disabled={disabled}
                  onClick={() => (isListening ? stop() : start())}
                  className={cn(
                    "rounded-full",
                    isListening &&
                      "bg-rf-coral/12 text-rf-coral hover:bg-rf-coral/16",
                  )}
                  size="icon-sm"
                  variant="ghost"
                />
              }
            >
              {isListening ? (
                <SquareIcon className="fill-current" />
              ) : (
                <MicIcon />
              )}
            </TooltipTrigger>
            <TooltipPopup>
              {isListening
                ? "Stop dictation"
                : "Dictate — text lands at your cursor"}
            </TooltipPopup>
          </Tooltip>
        ) : null}

        <InputGroupText className="ml-auto text-muted-foreground text-xs">
          {isListening ? "Listening…" : hint}
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}
