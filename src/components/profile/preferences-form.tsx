"use client";

import type React from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePreferences } from "@/actions/profile";
import { AGE_RANGES } from "@/lib/age-ranges";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MODULES, type ModuleKey } from "@/lib/modules";
import { cn } from "@/lib/utils";

export function PreferencesForm({
  defaultAgeRange,
  defaultPhoneNumber,
  defaultEnabledModules,
}: {
  defaultAgeRange: string | null;
  defaultPhoneNumber: string | null;
  defaultEnabledModules: ModuleKey[];
}): React.ReactElement {
  const [ageRange, setAgeRange] = useState(defaultAgeRange ?? "");
  const [phoneNumber, setPhoneNumber] = useState(defaultPhoneNumber ?? "");
  const [modules, setModules] = useState<Set<ModuleKey>>(
    () => new Set(defaultEnabledModules),
  );
  const [isPending, startTransition] = useTransition();

  const isDirty =
    ageRange !== (defaultAgeRange ?? "") ||
    phoneNumber !== (defaultPhoneNumber ?? "") ||
    modules.size !== defaultEnabledModules.length ||
    !defaultEnabledModules.every((m) => modules.has(m));

  function toggleModule(key: ModuleKey) {
    setModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updatePreferences({
        ageRange: ageRange || null,
        phoneNumber: phoneNumber.trim() || null,
        enabledModules: Array.from(modules),
      });
      if (res.error) toast.error(res.error);
      else toast.success("Preferences updated");
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-6 rounded-2xl border border-line bg-paper p-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
          Age range
        </span>
        <div className="flex flex-wrap gap-1.5">
          {AGE_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setAgeRange(range)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                ageRange === range
                  ? "border-rf-green-deep bg-g-green-pale text-rf-green-deep"
                  : "border-line bg-white text-body-muted hover:border-body-muted",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
          Phone number
        </span>
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1 555 123 4567"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
          Tools
        </span>
        {MODULES.map((m) => {
          const checked = modules.has(m.key);
          return (
            <label
              key={m.key}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                checked
                  ? "border-rf-green-deep/50 bg-g-green-pale"
                  : "border-line bg-white",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleModule(m.key)}
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-ink">
                  {m.label}
                </span>
                <span className="text-xs text-body-muted">
                  {m.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      <Button
        className="w-full"
        disabled={isPending || !isDirty}
        onClick={handleSave}
      >
        Save changes
      </Button>
    </div>
  );
}
