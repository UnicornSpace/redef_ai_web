"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";

type Tab = "challenges" | "leaderboard";

/**
 * Both slots are rendered (and their Suspense boundaries start streaming)
 * immediately regardless of which tab is active — the hidden one is just
 * CSS-hidden, not unmounted — so switching tabs never waits on a fetch that
 * could've already been in flight, and both start resolving in parallel
 * instead of one blocking the other behind a single Promise.all.
 */
export function ChallengesTabs({
  challengesSlot,
  leaderboardSlot,
}: {
  challengesSlot: ReactNode;
  leaderboardSlot: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("challenges");

  return (
    <div className="flex flex-col gap-2">
      <div className="px-4 pt-6 md:px-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTab value="challenges">Challenges</TabsTab>
            <TabsTab value="leaderboard">Leaderboard</TabsTab>
          </TabsList>
        </Tabs>
      </div>
      <div className={tab === "challenges" ? undefined : "hidden"}>
        {challengesSlot}
      </div>
      <div className={tab === "leaderboard" ? undefined : "hidden"}>
        {leaderboardSlot}
      </div>
    </div>
  );
}
