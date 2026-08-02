import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getMyHabitStatus, getPublicHabit } from "@/actions/habits";
import { JoinHabitButton } from "@/components/habits/join-habit-button";
import { Button } from "@/components/ui/button";
import {
  AVATAR_ACCENT_BG_CLASSES,
  accentIndexFor,
  initialsOf,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const habit = await getPublicHabit(id);
  if (!habit) return { title: "Habit invite | Redef AI" };

  const owner = habit.owner_display_name ?? "A friend";
  const title = `${owner} wants you to start "${habit.name}" | Redef AI`;
  const description =
    habit.description ??
    `Join ${owner} on Redef AI and track "${habit.name}" together.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Landing page for the "Invite a friend" link on a habit. Accepting links
 * the invitee's own progress to the ORIGINAL habit via habit_collaborators,
 * rather than cloning an independent copy.
 *
 * Deliberately exempted from the /app auth gate (see the pathname check in
 * src/app/app/layout.tsx) so it stays crawlable — chat apps need to fetch
 * this page's metadata/OG image without a session to render a link preview.
 * Signed-out humans still see the full invite context here; only the
 * accept action itself requires signing in.
 */
export default async function JoinHabitPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const [habit, status] = await Promise.all([
    getPublicHabit(id),
    getMyHabitStatus(id),
  ]);

  if (!habit) {
    return (
      <div className="flex w-full flex-col items-center gap-2 px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-ink">
          This habit link isn't valid anymore
        </h1>
        <p className="text-sm text-body-muted">
          The habit may have been deleted, or the link is wrong.
        </p>
      </div>
    );
  }

  const ownerName = habit.owner_display_name ?? "A friend";
  const ownerColor = AVATAR_ACCENT_BG_CLASSES[accentIndexFor(ownerName)];

  return (
    <div className="flex w-full flex-col items-center gap-5 px-4 py-16 text-center sm:py-24">
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-full text-lg font-extrabold text-white",
          ownerColor,
        )}
      >
        {initialsOf(ownerName)}
      </div>

      <div className="flex flex-col gap-2">
        <span className="mx-auto rounded-full bg-g-green-pale px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-rf-green-deep">
          Habit invite
        </span>
        <h1 className="max-w-md text-2xl font-extrabold text-ink">
          {ownerName} wants you to start “{habit.name}”
        </h1>
        {habit.description ? (
          <p className="max-w-md text-sm text-body-muted">
            {habit.description}
          </p>
        ) : null}
        <p className="max-w-md text-xs text-body-muted">
          Accept to track it alongside {ownerName} — same habit, your own
          streak, and you'll be able to compare progress any time.
        </p>
      </div>

      {status.collaboratorCount > 0 ? (
        <span className="rounded-full bg-line px-3 py-1 text-xs font-semibold text-body-muted">
          {status.collaboratorCount}{" "}
          {status.collaboratorCount === 1 ? "person is" : "people are"} already
          tracking this
        </span>
      ) : null}

      {status.isOwner ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-body-muted">This is your own habit.</p>
          <Button render={<Link href="/app/habits" />}>Go to my habits</Button>
        </div>
      ) : status.isCollaborator ? (
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex size-16 items-center justify-center rounded-full bg-g-green-pale text-rf-green-deep">
            <Check className="size-7" />
          </div>
          <span className="text-sm font-semibold text-body-muted">
            Already added
          </span>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/app/habits" />}
          >
            Go to my habits
          </Button>
        </div>
      ) : status.isAuthenticated ? (
        <JoinHabitButton habitId={id} />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            className="rounded-full"
            render={
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(`/app/habits/join/${id}`)}`}
              />
            }
          >
            Sign in to add this habit
          </Button>
          <p className="text-xs text-body-muted">
            No account yet? You'll get one in a few seconds.
          </p>
        </div>
      )}
    </div>
  );
}
