"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Challenge } from "@/lib/types/productivity";

export function ChallengesClient({
  initialChallenges,
}: {
  initialChallenges: Challenge[];
}) {
  return (
    <div className="flex flex-col gap-5 px-4 pb-16 md:px-8">
      {initialChallenges.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>No challenges available yet</EmptyTitle>
            <EmptyDescription>
              Curated challenges to join with the community will show up here.
              In the meantime, invite a friend to one of your habits from the
              Habits page.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {initialChallenges.map((c) => (
            <Link
              key={c.id}
              href={`/app/challenges/${c.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4 transition-colors hover:border-rf-green-deep/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-ink">{c.name}</h3>
                {c.category ? (
                  <span className="rounded-full bg-g-green-pale px-2 py-0.5 text-xs font-semibold text-rf-green-deep">
                    {c.category}
                  </span>
                ) : null}
              </div>
              {c.description ? (
                <p className="text-sm text-body-muted">{c.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
