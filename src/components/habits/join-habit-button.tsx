"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { joinHabitAsCollaborator } from "@/actions/habits";

export function JoinHabitButton({ habitId }: { habitId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await joinHabitAsCollaborator(habitId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.push("/app/habits");
    });
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label="Add to my habits"
        className="flex size-16 items-center justify-center rounded-full bg-rf-green-deep text-white shadow-lg shadow-rf-green-deep/24 transition-transform active:scale-95 disabled:opacity-70"
      >
        {pending ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <Plus className="size-7" />
        )}
      </button>
      <span className="text-sm font-semibold text-ink">Add to my habits</span>
    </div>
  );
}
