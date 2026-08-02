"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AVATAR_ACCENT_BG_CLASSES,
  accentIndexFor,
  initialsOf,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

export interface AvatarGroupPerson {
  id: string;
  label: string; // name or email — used for initials + color seed
}

export function AvatarGroup({
  people,
  max = 4,
  size = "size-6",
  className,
}: {
  people: AvatarGroupPerson[];
  max?: number;
  size?: string;
  className?: string;
}) {
  if (people.length === 0) return null;
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((p) => (
        <Avatar
          key={p.id}
          className={cn(
            size,
            "ring-2 ring-background",
            AVATAR_ACCENT_BG_CLASSES[accentIndexFor(p.id)],
          )}
        >
          <AvatarFallback className="bg-transparent text-[10px] font-bold text-white">
            {initialsOf(p.label)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            size,
            "flex items-center justify-center rounded-full bg-line ring-2 ring-background text-[10px] font-bold text-body-muted",
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
