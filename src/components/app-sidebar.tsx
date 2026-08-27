"use client";

import { BarChart3, Calendar, Timer, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { BsStars } from "react-icons/bs";
import { FaTasks } from "react-icons/fa";
import { FaMoneyBill } from "react-icons/fa6";
import { MdOutlineSettings } from "react-icons/md";
import { PiPlantBold } from "react-icons/pi";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { ModuleKey } from "@/lib/modules";

const NAV_ITEMS = [
  {
    href: "/app/talk",
    label: "Talk",
    icon: BsStars,
    size: "size-6!",
    moduleKey: null,
  },
  {
    href: "/app/habits",
    label: "Habits",
    icon: PiPlantBold,
    size: "size-6!",
    moduleKey: "habits" as ModuleKey,
  },
  {
    href: "/app/personal-finance",
    label: "Personal Finance",
    icon: FaMoneyBill,
    size: "size-6!",
    moduleKey: "personal_finance" as ModuleKey,
  },
  {
    href: "/app/tasks",
    label: "Tasks",
    icon: FaTasks,
    size: "size-5!",
    moduleKey: "tasks" as ModuleKey,
  },
  {
    href: "/app/deep-work",
    label: "Deep Work",
    icon: Timer,
    size: "size-6!",
    moduleKey: "deep_work" as ModuleKey,
  },
  {
    href: "/app/calendar",
    label: "Calendar",
    icon: Calendar,
    size: "size-5!",
    moduleKey: null,
  },
  {
    href: "/app/challenges",
    label: "Challenges",
    icon: Trophy,
    size: "size-5!",
    moduleKey: null,
  },
  {
    href: "/app/reports",
    label: "Reports",
    icon: BarChart3,
    size: "size-5!",
    moduleKey: null,
  },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  enabledModules,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  enabledModules: ModuleKey[];
}) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      item.moduleKey === null || enabledModules.includes(item.moduleKey),
  );

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="rounded-4xl w-64 border-r bg-sidebar border-sidebar-border"
    >
      <SidebarHeader className="flex flex-row items-center justify-start gap-2 bg-sidebar pt-4 group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:px-0!">
        <Link
          href="/app/talk"
          className="flex items-center gap-1 pl-2 group-data-[collapsible=icon]:pl-0"
        >
          <Image
            src={"/logo.png"}
            height={32}
            width={32}
            alt=""
            className="shrink-0"
          />
          <span className="text-lg text-sidebar-foreground font-extrabold tracking-tight group-data-[collapsible=icon]:hidden">
            RedefAI
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar pt-8 ">
        <SidebarGroup className="flex justify-center">
          <SidebarMenu className="gap-3 ml-2 group-data-[collapsible=icon]:ml-0">
            {visibleItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className=" "
                    tooltip={item.label}
                    isActive={active}
                    render={<Link href={item.href} />}
                  >
                    <item.icon
                      className={`text-sidebar-foreground ${item.size} group-data-[collapsible=icon]:size-4.5!`}
                    />
                    <span className="text-base text-sidebar-foreground">
                      {item.label}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-sidebar pb-4 pl-3 space-y-4 group-data-[collapsible=icon]:pl-0! group-data-[collapsible=icon]:items-center!">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={"Settings"}
              isActive={isActivePath(pathname, "/app/profile")}
              render={<Link href="/app/profile/account" />}
            >
              <MdOutlineSettings className="text-sidebar-foreground size-5! group-data-[collapsible=icon]:size-4.5!" />
              <span className="text-base text-sidebar-foreground">
                Settings
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
