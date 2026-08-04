"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, SettingsIcon } from "lucide-react";
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
}: {
  email?: string;
  avatarUrl?: string;
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
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 md:hidden">
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
