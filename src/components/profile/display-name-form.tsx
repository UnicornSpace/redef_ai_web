"use client";

import type React from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DisplayNameForm({
  defaultValue,
}: {
  defaultValue: string;
}): React.ReactElement {
  const [name, setName] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const res = await updateProfile({ fullName: name });
      if (res.error) toast.error(res.error);
      else toast.success("Profile updated");
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
        Display name
      </span>
      <div className="flex gap-2">
        <Input
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          value={name}
        />
        <Button
          disabled={isPending || !name.trim() || name === defaultValue}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
