"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type Enthusiasm,
  type UserPreferences,
  updateUserPreferences,
  type Verbosity,
} from "@/actions/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const OCCUPATIONS = [
  "Student",
  "Software Engineer",
  "Founder / Entrepreneur",
  "Designer",
  "Manager",
  "Teacher / Educator",
  "Freelancer",
  "Other",
];

export function PersonalizationClient({
  initialPreferences,
}: {
  initialPreferences: UserPreferences | null;
}) {
  const [nickname, setNickname] = useState(initialPreferences?.nickname ?? "");
  const [occupation, setOccupation] = useState(
    initialPreferences?.occupation ?? "",
  );
  const [enthusiasm, setEnthusiasm] = useState<Enthusiasm>(
    initialPreferences?.traits.enthusiasm ?? "medium",
  );
  const [verbosity, setVerbosity] = useState<Verbosity>(
    initialPreferences?.traits.verbosity ?? "balanced",
  );
  const [useImages, setUseImages] = useState(
    initialPreferences?.traits.useImages ?? true,
  );
  const [customInstructions, setCustomInstructions] = useState(
    initialPreferences?.custom_instructions ?? "",
  );
  const [memorySummary, setMemorySummary] = useState(
    initialPreferences?.memory_summary ?? "",
  );
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const res = await updateUserPreferences({
        nickname: nickname.trim() || null,
        occupation: occupation.trim() || null,
        traits: { enthusiasm, verbosity, useImages },
        customInstructions: customInstructions.trim() || null,
        memorySummary: memorySummary.trim() || null,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Saved");
    });
  }

  return (
    <div className="flex max-w-lg flex-col gap-6 px-4 pb-16 md:px-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-body-muted">
          About you
        </h2>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-body-muted">
            Nickname
          </span>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="What should Redef call you?"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-body-muted">
            Occupation
          </span>
          <Input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="e.g. Software Engineer"
            list="occupations"
          />
          <datalist id="occupations">
            {OCCUPATIONS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-body-muted">
          Personalization
        </h2>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-body-muted">
            Enthusiasm
          </span>
          <Tabs
            value={enthusiasm}
            onValueChange={(v) => setEnthusiasm(v as Enthusiasm)}
          >
            <TabsList>
              <TabsTab value="low">Low</TabsTab>
              <TabsTab value="medium">Medium</TabsTab>
              <TabsTab value="high">High</TabsTab>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-body-muted">
            Response length
          </span>
          <Tabs
            value={verbosity}
            onValueChange={(v) => setVerbosity(v as Verbosity)}
          >
            <TabsList>
              <TabsTab value="concise">Concise</TabsTab>
              <TabsTab value="balanced">Balanced</TabsTab>
              <TabsTab value="detailed">Detailed</TabsTab>
            </TabsList>
          </Tabs>
        </div>
        <label
          htmlFor="use-images"
          className="flex items-center justify-between gap-3"
        >
          <span className="text-sm text-ink">
            Allow images in responses
          </span>
          <Switch
            id="use-images"
            checked={useImages}
            onCheckedChange={setUseImages}
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-body-muted">
            Custom instructions
          </span>
          <Textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Anything else Redef should always keep in mind?"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-body-muted">
          Memory
        </h2>
        <p className="text-xs text-body-muted">
          A running summary of what Redef has picked up about you across
          conversations. You can edit or clear it any time — if it&apos;s
          wrong, correcting it here changes what Redef believes.
        </p>
        <Textarea
          value={memorySummary}
          onChange={(e) => setMemorySummary(e.target.value)}
          placeholder="Nothing remembered yet."
        />
      </div>

      <Button onClick={handleSave} loading={isPending} className="w-fit">
        Save
      </Button>
    </div>
  );
}
