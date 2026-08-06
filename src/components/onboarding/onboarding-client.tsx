"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { checkUsernameAvailable, completeOnboarding } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DEFAULT_ENABLED_MODULES, MODULES, type ModuleKey } from "@/lib/modules";
import { cn } from "@/lib/utils";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function OnboardingClient({
  suggestedUsername,
}: {
  suggestedUsername: string;
}): React.ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState(suggestedUsername);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [modules, setModules] = useState<Set<ModuleKey>>(
    () => new Set(DEFAULT_ENABLED_MODULES),
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const timeout = setTimeout(() => {
      checkUsernameAvailable(trimmed).then((res) => {
        setUsernameStatus(res.available ? "available" : res.error ? "invalid" : "taken");
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, [username]);

  function toggleModule(key: ModuleKey) {
    setModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleContinue() {
    if (usernameStatus !== "available") return;
    startTransition(async () => {
      const res = await completeOnboarding({
        username,
        enabledModules: Array.from(modules),
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.push("/app");
    });
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-extrabold text-ink">Welcome to RedefAI</h1>
        <p className="text-sm text-body-muted">
          Pick a username and the tools you want.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          value={username}
          onChange={(e) =>
            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          placeholder="username"
        />
        {usernameStatus === "taken" ? (
          <span className="text-xs text-rf-coral">Taken — try another</span>
        ) : null}
        {usernameStatus === "invalid" ? (
          <span className="text-xs text-rf-coral">
            3-20 letters, numbers, or underscores
          </span>
        ) : null}
        {usernameStatus === "available" ? (
          <span className="text-xs text-rf-green-deep">Available</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {MODULES.map((m) => {
          const checked = modules.has(m.key);
          return (
            <label
              key={m.key}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                checked
                  ? "border-rf-green-deep/50 bg-g-green-pale"
                  : "border-line bg-paper",
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
        disabled={isPending || usernameStatus !== "available"}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </div>
  );
}
