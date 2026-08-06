import { notFound } from "next/navigation";
import { getPublicProfile } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { computeTenureAchievements } from "@/lib/achievements";
import { AVATAR_ACCENT_BG_CLASSES, accentIndexFor, initialsOf } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const achievements = computeTenureAchievements(profile.memberSince);
  const accentClass = AVATAR_ACCENT_BG_CLASSES[accentIndexFor(profile.displayName)];
  const memberSinceLabel = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section className="flex w-full items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-line bg-paper p-8 text-center">
        <Avatar className="size-24 text-3xl">
          <AvatarImage
            alt={profile.displayName}
            referrerPolicy="no-referrer"
            src={profile.avatarUrl ?? undefined}
          />
          <AvatarFallback
            className={cn("font-bold text-white", accentClass)}
          >
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
                  {a.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
