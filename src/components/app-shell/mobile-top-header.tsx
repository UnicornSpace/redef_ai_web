"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import type React from "react";
import { createClient } from "@/lib/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AVATAR_ACCENT_BG_CLASSES,
  accentIndexFor,
  initialsOf,
} from "@/lib/avatar";

export function MobileTopHeader({
  email,
  avatarUrl,
  username,
}: {
  email?: string;
  avatarUrl?: string;
  /** Passed from /app/layout.tsx (profile.username). Enables the
      "View public profile" link. Omitted only in the impossible-in-
      -practice case where the layout couldn't resolve the profile. */
  username?: string;
}): React.ReactElement {
  const router = useRouter();
  const label = email ?? "Account";
  const initials = initialsOf(label);
  const accentClass = AVATAR_ACCENT_BG_CLASSES[accentIndexFor(label)];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur md:hidden">
      <Link href="/app" className="flex items-center gap-2">
        <Image
          alt=""
          className="shrink-0"
          height={24}
          src="/logo.png"
          width={24}
        />
        <span className="text-base font-extrabold tracking-tight text-ink">
          RedefAI
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Account menu"
            className="flex size-8 items-center justify-center rounded-full"
            type="button"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external
              // Google-hosted photo; next/image would need the host
              // allowlisted in next.config.ts for one small avatar.
              <img
                alt=""
                className="size-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
                src={avatarUrl}
              />
            ) : (
              <span
                className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white ${accentClass}`}
              >
                {initials}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {username ? (
            <DropdownMenuItem asChild>
              <Link
                className="flex items-center gap-2"
                href={`/u/${username}`}
              >
                <UserIcon />
                <span className="flex flex-col">
                  <span>View public profile</span>
                  <span className="text-[10px] text-body-muted">
                    /u/{username}
                  </span>
                </span>
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link className="flex items-center gap-2" href="/app/profile/account">
              <SettingsIcon />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} variant="destructive">
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
