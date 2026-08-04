"use client";

import { Calendar, House, MoreHorizontal, Plus, Timer, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type React from "react";
import { BsStars } from "react-icons/bs";
import { FaTasks } from "react-icons/fa";
import { FaMoneyBill } from "react-icons/fa6";
import { PiPlantBold } from "react-icons/pi";
import { useMobileFab } from "@/components/app-shell/mobile-fab-context";
import {
  Drawer,
  DrawerHeader,
  DrawerMenu,
  DrawerMenuItem,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const PRIMARY_ITEMS = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/challenges", label: "Challenges", icon: Trophy },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
];

const MORE_ITEMS = [
  { href: "/app/talk", label: "Talk", icon: BsStars },
  { href: "/app/habits", label: "Habits", icon: PiPlantBold },
  {
    href: "/app/personal-finance",
    label: "Personal Finance",
    icon: FaMoneyBill,
  },
  { href: "/app/tasks", label: "Tasks", icon: FaTasks },
  { href: "/app/deep-work", label: "Deep Work", icon: Timer },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar(): React.ReactElement {
  const pathname = usePathname();
  const fab = useMobileFab();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex items-center justify-center gap-3 px-4 md:hidden">
      <nav className="flex items-center gap-1 rounded-full border border-line bg-paper p-1.5 shadow-lg">
        {PRIMARY_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              aria-label={item.label}
              className={cn(
                "flex size-11 items-center justify-center rounded-full transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-body-muted hover:bg-muted",
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon size={20} />
            </Link>
          );
        })}
        <Drawer onOpenChange={setMoreOpen} open={moreOpen}>
          <button
            aria-label="More"
            className="flex size-11 items-center justify-center rounded-full text-body-muted transition-colors hover:bg-muted"
            onClick={() => setMoreOpen(true)}
            type="button"
          >
            <MoreHorizontal size={20} />
          </button>
          <DrawerPopup showBar>
            <DrawerHeader>
              <DrawerTitle>More</DrawerTitle>
            </DrawerHeader>
            <DrawerPanel>
              <DrawerMenu>
                {MORE_ITEMS.map((item) => (
                  <DrawerMenuItem
                    key={item.href}
                    render={
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                      />
                    }
                  >
                    <item.icon size={18} />
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
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          onClick={fab.onClick}
          type="button"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}
