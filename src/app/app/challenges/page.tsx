import { Suspense } from "react";
import { getLeaderboard, listChallenges } from "@/actions/challenges";
import {
  CardGridSkeleton,
  PageHeader,
} from "@/components/app-shell/page-header";
import { ChallengesTabs } from "@/components/challenges/challenges-tabs";

async function ChallengesData() {
  const [challenges, leaderboard] = await Promise.all([
    listChallenges(),
    getLeaderboard(),
  ]);
  return <ChallengesTabs challenges={challenges} leaderboard={leaderboard} />;
}

export default function ChallengesPage() {
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Challenges"
        // description="Compete with friends on a shared habit — start one, invite people, and see who's kept it up the most."
      />
      <Suspense
        fallback={<CardGridSkeleton className="mt-6" cards={2} columns={2} />}
      >
        <ChallengesData />
      </Suspense>
    </div>
  );
}
