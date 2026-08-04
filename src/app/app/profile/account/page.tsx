import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { getUserPreferences } from "@/actions/chat";
import { PageHeader } from "@/components/app-shell/page-header";
import { LogoutButton } from "@/components/logout-button";
import { DisplayNameForm } from "@/components/profile/display-name-form";
import { createClient } from "@/lib/server";
import {
  AVATAR_ACCENT_BG_CLASSES,
  accentIndexFor,
  displayNameOf,
  initialsOf,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

function summarizePreferences(
  preferences: Awaited<ReturnType<typeof getUserPreferences>>,
): string {
  if (!preferences) return "Not set up yet";
  const parts = [preferences.nickname, preferences.occupation].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" · ") : "Not set up yet";
}

const AccountPage = async () => {
  const supabase = await createClient();
  const [{ data }, preferences] = await Promise.all([
    supabase.auth.getUser(),
    getUserPreferences(),
  ]);
  const email = data.user?.email;
  const fullName = data.user?.user_metadata?.full_name as string | undefined;
  const avatarUrl = (data.user?.user_metadata?.avatar_url ??
    data.user?.user_metadata?.picture) as string | undefined;
  const emailVerified = Boolean(data.user?.email_confirmed_at);
  const createdAt = data.user?.created_at;

  const label = email ?? "Account";
  const displayName = fullName || (email ? displayNameOf(email) : "Account");
  const initials = initialsOf(fullName || label);
  const accentClass = AVATAR_ACCENT_BG_CLASSES[accentIndexFor(label)];

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Account"
        description="Your Redef AI account details."
      />
      <div className="flex flex-col gap-6 px-4 pb-10 md:px-8">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external
            // Google-hosted photo; next/image would need the host
            // allowlisted in next.config.ts for one small avatar.
            <img
              alt=""
              className="size-14 shrink-0 rounded-full object-cover"
              referrerPolicy="no-referrer"
              src={avatarUrl}
            />
          ) : (
            <span
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white",
                accentClass,
              )}
            >
              {initials}
            </span>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-ink">
              {displayName}
            </span>
            <span className="text-sm text-body-muted">{email ?? "—"}</span>
            {createdAt ? (
              <span className="text-xs text-body-muted">
                Member since{" "}
                {new Date(createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex max-w-md flex-col gap-4 rounded-2xl border border-line bg-paper p-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
              Email verified
            </span>
            <span
              className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ${
                emailVerified
                  ? "bg-g-green-pale text-rf-green-deep"
                  : "bg-[rgba(255,106,85,0.12)] text-rf-coral"
              }`}
            >
              {emailVerified ? "Yes" : "No"}
            </span>
          </div>
          <DisplayNameForm defaultValue={displayName} />
          <div className="pt-2">
            <LogoutButton />
          </div>
        </div>

        <div className="flex max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-paper">
          <Link
            href="/app/profile/personalization"
            className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 transition-colors hover:bg-muted/50"
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-ink">
                Personalization
              </span>
              <span className="text-xs text-body-muted">
                {summarizePreferences(preferences)}
              </span>
            </div>
            <ChevronRightIcon className="shrink-0 text-body-muted" size={18} />
          </Link>
          <Link
            href="/app/profile/referral"
            className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-ink">
                Invite friends
              </span>
              <span className="text-xs text-body-muted">
                Share your referral link
              </span>
            </div>
            <ChevronRightIcon className="shrink-0 text-body-muted" size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
