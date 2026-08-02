import { redirect } from "next/navigation";
import { getChallenge, joinChallenge } from "@/actions/challenges";
import { Button } from "@/components/ui/button";

export default async function JoinChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getChallenge(id);

  async function handleJoin() {
    "use server";
    const res = await joinChallenge(id);
    if (!res.error) redirect(`/app/challenges/${id}`);
  }

  if (!result) {
    return (
      <div className="flex w-full flex-col items-center gap-2 px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-ink">
          This challenge doesn't exist
        </h1>
        <p className="text-sm text-body-muted">
          The invite link may be wrong or the challenge was deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="rounded-full bg-g-green-pale px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-rf-green-deep">
        You're invited
      </span>
      <h1 className="text-2xl font-extrabold text-ink">
        {result.challenge.name}
      </h1>
      {result.challenge.description ? (
        <p className="max-w-md text-sm text-body-muted">
          {result.challenge.description}
        </p>
      ) : null}
      <p className="text-xs text-body-muted">
        {result.participants.length} people already in this challenge
      </p>
      <form action={handleJoin}>
        <Button type="submit" size="lg">
          Join this challenge
        </Button>
      </form>
    </div>
  );
}
