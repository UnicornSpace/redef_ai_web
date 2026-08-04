import { Suspense } from "react";
import { getLeaderboard, listChallenges } from "@/actions/challenges";
import {
  CardGridSkeleton,
  ListRowsSkeleton,
  PageHeader,
} from "@/components/app-shell/page-header";
import { ChallengesClient } from "@/components/challenges/challenges-client";
import { ChallengesTabs } from "@/components/challenges/challenges-tabs";
import { LeaderboardClient } from "@/components/challenges/leaderboard-client";

async function ChallengesSection() {
  const challenges = await listChallenges();
  return <ChallengesClient initialChallenges={challenges} />;
}

async function LeaderboardSection() {
  const leaderboard = await getLeaderboard();
  return <LeaderboardClient entries={leaderboard} />;
}

export default function ChallengesPage() {
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Challenges"
        // description="Compete with friends on a shared habit — start one, invite people, and see who's kept it up the most."
      />
      <ChallengesTabs
        challengesSlot={
          <Suspense
            fallback={
              <CardGridSkeleton className="mt-6" cards={2} columns={2} />
            }
          >
            <ChallengesSection />
          </Suspense>
        }
        leaderboardSlot={
          <Suspense fallback={<ListRowsSkeleton rows={5} />}>
            <LeaderboardSection />
          </Suspense>
        }
      />
    </div>
  );
}
