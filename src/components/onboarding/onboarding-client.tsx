"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { checkUsernameAvailable, completeOnboarding } from "@/actions/profile";
import { AGE_RANGES } from "@/lib/age-ranges";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DEFAULT_ENABLED_MODULES, MODULES, type ModuleKey } from "@/lib/modules";
import { cn } from "@/lib/utils";
import Image from "next/image";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";
type Step = "profile" | "modules";

export function OnboardingClient({
  suggestedUsername,
}: {
  suggestedUsername: string;
}): React.ReactElement {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [username, setUsername] = useState(suggestedUsername);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [ageRange, setAgeRange] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
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
      // Without a .catch(), any rejection from the server action (a dev-
      // server compile hiccup, a network blip, an auth expiry) becomes an
      // unhandled Promise rejection — which surfaces in the console as
      // "An unexpected response was received from the server" with no
      // useful stack. Treat any failure as "we don't know yet" (idle) and
      // let the user retry by editing the field.
      checkUsernameAvailable(trimmed)
        .then((res) => {
          setUsernameStatus(
            res.available ? "available" : res.error ? "invalid" : "taken",
          );
        })
        .catch(() => {
          setUsernameStatus("idle");
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

  function handleContinueFromProfile() {
    if (usernameStatus !== "available") return;
    setStep("modules");
  }

  function handleFinish() {
    startTransition(async () => {
      const res = await completeOnboarding({
        username,
        enabledModules: Array.from(modules),
        ageRange: ageRange || null,
        phoneNumber: phoneNumber.trim() || null,
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
      {step === "profile" ? (
        <>
          <div className="flex flex-col gap-1 text-center">
            <Image 
              src="/logo.png"
              alt="RedefAI Logo"
              width={48}
              height={48}
              className="mx-auto"
            />
            <h1 className="text-2xl font-extrabold text-ink">
              Welcome to RedefAI
            </h1>
            <p className="text-sm text-body-muted">
              A few quick details to get you set up.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
              Username
            </span>
            <Input
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
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
              Phone number{" "}
              <span className="font-normal normal-case text-body-muted/70">
                (optional)
              </span>
            </span>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 555 123 4567"
            />
          </div>

          <Button
            className="w-full"
            disabled={usernameStatus !== "available"}
            onClick={handleContinueFromProfile}
          >
            Continue
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-2xl font-extrabold text-ink">
              What do you want to use?
            </h1>
            <p className="text-sm text-body-muted">
              Pick the tools you want. You can change this later in Settings.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {MODULES.map((m) => {
              const checked = modules.has(m.key);
              return (
                <label
                  key={m.key}
                  className={cn(
                    "flex cursor-pointer items-center  gap-3 rounded-lg *:border p-4 transition-colors",
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
                    <span className="text-[10px] text-body-muted">
                      {m.description}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep("profile")}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={isPending}
              onClick={handleFinish}
            >
              Get started
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
