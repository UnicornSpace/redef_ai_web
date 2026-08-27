"use client";

import {
  BarChart3,
  Calendar,
  House,
  MoreHorizontal,
  Plus,
  Timer,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type React from "react";
import { BsStars } from "react-icons/bs";
import { FaTasks } from "react-icons/fa";
import { FaMoneyBill } from "react-icons/fa6";
import { PiPlantBold } from "react-icons/pi";
import {
  useMobileFab,
  useMobileNavHidden,
} from "@/components/app-shell/mobile-fab-context";
import {
  Drawer,
  DrawerHeader,
  DrawerMenu,
  DrawerMenuItem,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { ModuleKey } from "@/lib/modules";
import { cn } from "@/lib/utils";

const PRIMARY_ITEMS = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/challenges", label: "Challenges", icon: Trophy },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
];

const MORE_ITEMS = [
  { href: "/app/talk", label: "Talk", icon: BsStars, moduleKey: null },
  {
    href: "/app/habits",
    label: "Habits",
    icon: PiPlantBold,
    moduleKey: "habits" as ModuleKey,
  },
  {
    href: "/app/personal-finance",
    label: "Personal Finance",
    icon: FaMoneyBill,
    moduleKey: "personal_finance" as ModuleKey,
  },
  {
    href: "/app/tasks",
    label: "Tasks",
    icon: FaTasks,
    moduleKey: "tasks" as ModuleKey,
  },
  {
    href: "/app/deep-work",
    label: "Deep Work",
    icon: Timer,
    moduleKey: "deep_work" as ModuleKey,
  },
  {
    href: "/app/reports",
    label: "Reports",
    icon: BarChart3,
    moduleKey: null,
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar({
  enabledModules,
}: {
  enabledModules: ModuleKey[];
}): React.ReactElement | null {
  const pathname = usePathname();
  const fab = useMobileFab();
  const navHidden = useMobileNavHidden();
  const [moreOpen, setMoreOpen] = useState(false);

  // An in-progress chat conversation is a full-screen, input-focused
  // surface — a competing bottom nav bar just eats space and gets in the
  // way, same as most chat apps hide their own tab bar once you're inside a
  // conversation. Landing on /app/talk itself (no messages yet) still shows
  // the nav like any other page — see ChatPane's useSetNavHidden call.
  if (navHidden) return null;

  const visibleMoreItems = MORE_ITEMS.filter(
    (item) => item.moduleKey === null || enabledModules.includes(item.moduleKey),
  );

  return (
    <div className="fixed inset-x-0 bottom-7 z-40 flex items-center justify-center gap-3 px-4 md:hidden">
      <nav className="flex items-center gap-1.6 rounded-full border border-line bg-paper p-2 shadow-lg">
        {PRIMARY_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              aria-label={item.label}
              className={cn(
                "flex size-12 items-center justify-center rounded-full transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-body-muted hover:bg-muted",
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon size={22} />
            </Link>
          );
        })}
        <Drawer onOpenChange={setMoreOpen} open={moreOpen}>
          <button
            aria-label="More"
            className="flex size-12 items-center justify-center rounded-full text-body-muted transition-colors hover:bg-muted"
            onClick={() => setMoreOpen(true)}
            type="button"
          >
            <MoreHorizontal size={22} />
          </button>
          <DrawerPopup showBar>
            <DrawerHeader className="items-center">
              <DrawerTitle>More</DrawerTitle>
            </DrawerHeader>
            <DrawerPanel>
              <DrawerMenu className="gap-1 flex flex-col items-center">
                {visibleMoreItems.map((item) => (
                  <DrawerMenuItem
                    className="min-h-10 gap-3 px-3 text-lg flex flex-row justify-center-center items-center mx-auto"
                    key={item.href}
                    render={
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                      />
                    }
                  >
                    <item.icon size={26} />
                    {item.label}
                  </DrawerMenuItem>
                ))}
              </DrawerMenu>
            </DrawerPanel>
          </DrawerPopup>
        </Drawer>
      </nav>

      {fab && (
        <button
          aria-label={fab.label}
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          onClick={fab.onClick}
          type="button"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
}
