import { notFound } from "next/navigation";
import { getPublicActivityHeatmap } from "@/actions/activity";
import { getPublicProfile } from "@/actions/profile";
import { ActivityHeatmap } from "@/components/activity/activity-heatmap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { computeTenureAchievements } from "@/lib/achievements";
import {
  AVATAR_ACCENT_BG_CLASSES,
  accentIndexFor,
  initialsOf,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";
import ShinyText from "@/components/shiny-text";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [profile, activity] = await Promise.all([
    getPublicProfile(username),
    // Returns null when the user opted out of public activity — the page
    // simply omits the heatmap section in that case rather than showing
    // an empty one, since "empty" would leak the fact they've been away.
    getPublicActivityHeatmap(username),
  ]);
  if (!profile) notFound();

  const achievements = computeTenureAchievements(profile.memberSince);
  const accentClass =
    AVATAR_ACCENT_BG_CLASSES[accentIndexFor(profile.displayName)];
  const memberSinceLabel = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section className="flex flex-col w-full items-center justify-center px-6 py-4">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6  p-8 text-center">
        <Avatar className="size-24 text-3xl">
          <AvatarImage
            alt={profile.displayName}
            referrerPolicy="no-referrer"
            src={profile.avatarUrl ?? undefined}
          />
          <AvatarFallback className={cn("font-bold text-white", accentClass)}>
            {initialsOf(profile.displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-extrabold text-ink">
            {profile.displayName}
          </h1>
          <p className="text-sm text-body-muted">@{profile.username}</p>
          {memberSinceLabel ? (
            <p className="text-xs text-body-muted">
              Member since {memberSinceLabel}
            </p>
          ) : null}
        </div>

        {achievements.length > 0 ? (
          <div className="flex w-full flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
              Achievements
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {achievements.map((a) => (
                <span
                  key={a.key}
                  className="flex items-center gap-1.5 rounded-full bg-g-green-pale px-3 py-1.5 text-xs font-semibold text-rf-green-deep"
                >
                  <span aria-hidden="true">{a.emoji}</span>

                  <ShinyText
                    text={a.label}
                    speed={2}
                    delay={0}
                    color="#000"
                    shineColor="#ffffff"
                    spread={120}
                    direction="left"
                    yoyo={false}
                    pauseOnHover={false}
                    disabled={false}
                  />
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {activity ? (
        <div className="mt-8 w-full max-w-3xl">
          <div className="-mb-3 flex items-baseline justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
              Activity, last 12 months
            </span>
            <span className="text-xs text-body-muted">
              {activity.points.length} active days
            </span>
          </div>
          <ActivityHeatmap
            points={activity.points}
            from={activity.from}
            to={activity.to}
            emptyMessage="No habits completed yet."
          />
        </div>
      ) : null}
    </section>
  );
}
