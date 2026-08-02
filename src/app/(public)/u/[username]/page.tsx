"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const stats = [
  { label: "Projects", value: "48" },
  { label: "Followers", value: "2.1k" },
  { label: "Rating", value: "4.9" },
];
import {
    RiArrowRightUpLine,
  RiCalendarLine,
  RiChat1Line,
  RiCheckLine,
  RiHeart3Line,
  RiLinkM,
  RiMapPinLine,
  RiSparkling2Fill,
} from "react-icons/ri";
import { Separator } from "@/components/ui/separator";
const posts = [
  {
    title: "Designing tokens that scale",
    excerpt:
      "How we restructured our design tokens into three tiers and cut theme work to almost nothing.",
    date: "Jun 14, 2026",
    likes: 184,
    comments: 23,
  },
  {
    title: "The case for boring infrastructure",
    excerpt:
      "Reliability is a feature. A look at why we chose the least exciting option at every layer.",
    date: "May 28, 2026",
    likes: 142,
    comments: 17,
  },
];

const info = [
  { icon: RiMapPinLine, label: "Berlin, Germany" },
  { icon: RiLinkM, label: "priyanair.design" },
  { icon: RiCalendarLine, label: "Joined March 2021" },
];

const team = [
  { name: "Ada", src: "https://i.pravatar.cc/64?img=47" },
  { name: "Leo", src: "https://i.pravatar.cc/64?img=12" },
  { name: "Mara", src: "https://i.pravatar.cc/64?img=32" },
  { name: "Owen", src: "https://i.pravatar.cc/64?img=53" },
];
export default function ProfileBlock() {
  const [following, setFollowing] = React.useState(false);

  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar className="size-20 border border-border">
              <AvatarImage
                src="https://i.pravatar.cc/160?img=12"
                alt="Marcus Trent"
                className="grayscale"
              />
              <AvatarFallback>MT</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold">Marcus Trent</h1>
                <Badge variant="secondary">Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Product Designer</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <RiMapPinLine className="size-3.5" aria-hidden="true" />
                San Francisco, CA
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 divide-x divide-border border-y border-border">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-0.5 py-3"
              >
                <span className="text-sm font-semibold tabular-nums">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          <Button
            className="flex-1"
            aria-pressed={following}
            variant={following ? "outline" : "default"}
            onClick={() => setFollowing((v) => !v)}
          >
            {following ? "Following" : "Follow"}
          </Button>
          <Button variant="outline" className="flex-1">
            Message
          </Button>
        </CardFooter>
      </Card>
      <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
        <div className="mx-auto w-full max-w-lg border border-border bg-background p-6">
          <div className="flex items-start gap-4">
            <span
              className="flex size-14 shrink-0 items-center justify-center bg-primary text-primary-foreground"
              aria-hidden="true"
            >
              <RiSparkling2Fill className="size-7" />
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight">
                  Acme Labs
                </h1>
                <Badge variant="secondary" className="gap-1">
                  <RiCheckLine className="size-3" aria-hidden="true" />
                  Verified
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Design tools for product teams
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm/relaxed text-foreground/80">
            We build calm, reliable software for the teams that ship the
            products you use every day. Trusted by more than 4,000 companies
            worldwide.
          </p>

          <div className="mt-5 grid grid-cols-3 divide-x divide-border border-y border-border">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-0.5 py-3"
              >
                <span className="text-sm font-semibold tabular-nums">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {team.map((member) => (
                  <Avatar
                    key={member.name}
                    className="size-7 border-2 border-background"
                  >
                    <AvatarImage
                      src={member.src}
                      alt={member.name}
                      className="grayscale"
                    />
                    <AvatarFallback className="text-[10px]">
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">44 Members</span>
            </div>
            <a
              href="#"
              className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
            >
              View all
            </a>
          </div>

          <Separator className="my-5" />

          <div className="flex items-center gap-2">
            <Button
              className="flex-1"
              render={<a href="#" />}
            //   nativeButton={false}
            >
              Visit Website
              <RiArrowRightUpLine data-icon="inline-end" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              render={<a href="#" />}
              //   nativeButton={false}
            >
              Contact
            </Button>
          </div>
        </div>
      </section>
    </section>
  );
}
