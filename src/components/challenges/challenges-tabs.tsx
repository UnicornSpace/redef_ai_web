"use client";

import { useState } from "react";
import type { LeaderboardEntry } from "@/actions/challenges";
import { ChallengesClient } from "@/components/challenges/challenges-client";
import { LeaderboardClient } from "@/components/challenges/leaderboard-client";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import type { Challenge } from "@/lib/types/productivity";

type Tab = "challenges" | "leaderboard";

export function ChallengesTabs({
  challenges,
  leaderboard,
}: {
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
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
      {tab === "challenges" ? (
        <ChallengesClient initialChallenges={challenges} />
      ) : (
        <LeaderboardClient entries={leaderboard} />
      )}
    </div>
  );
}
