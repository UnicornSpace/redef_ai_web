"use client";

import { Check, ChevronRightIcon, Copy, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReferredUser } from "@/actions/chat";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  AVATAR_ACCENT_BG_CLASSES,
  accentIndexFor,
  initialsOf,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { AdmitOneTicket } from "../referral-card";

function ReferralRow({ referral }: { referral: ReferredUser }) {
  const accentClass =
    AVATAR_ACCENT_BG_CLASSES[accentIndexFor(referral.displayName)];
  const joinedLabel = referral.joinedAt
    ? new Date(referral.joinedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const content = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
          accentClass,
        )}
      >
        {initialsOf(referral.displayName)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-ink">
          {referral.displayName}
        </span>
        <span className="truncate text-xs text-body-muted">
          {referral.username
            ? `@${referral.username}`
            : "Hasn't set up a profile yet"}
          {joinedLabel ? ` · joined ${joinedLabel}` : ""}
        </span>
      </div>
      {referral.username ? (
        <ChevronRightIcon className="shrink-0 text-body-muted" size={16} />
      ) : null}
    </>
  );

  if (referral.username) {
    return (
      <Link
        href={`/u/${referral.username}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
      >
        {content}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3 opacity-80">
      {content}
    </div>
  );
}

export function ReferralClient({
  code,
  referralPath,
  referrals,
}: {
  code: string;
  referralPath: string;
  referrals: ReferredUser[];
}) {
  const [copied, setCopied] = useState(false);
  const [referralUrl, setReferralUrl] = useState(referralPath);

  useEffect(() => {
    setReferralUrl(`${window.location.origin}${referralPath}`);
  }, [referralPath]);

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex max-w-md flex-col gap-4 px-4 pb-16 md:px-8">
      <AdmitOneTicket
        tilt={3}
        name={code}
        presenter={"RedefAI presents"}
        event="Share the Vibe"
        venue="Be the one who Adds value"
        // dates="July 25–26"
        stubText="REFERRAL"
        watermark="2026"
        width={400}
      />

      <div className="flex gap-2">
        <Input value={referralUrl} readOnly className="text-sm" />
        <Button variant="outline" size="icon" onClick={handleCopy}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <p className="text-xs text-body-muted">
        Share this link — anyone who signs up through it shows up below.
      </p>
      {/* <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
            Your referral code
          </span>
          <span className="text-2xl font-extrabold tracking-wide text-ink">
            {code}
          </span>
        </div>
      </div> */}

      <div className="flex flex-col mt-6 overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <span className="text-sm font-semibold text-ink">
            People you've invited
          </span>
          <span className="rounded-full bg-g-green-pale px-2.5 py-0.5 text-xs font-bold text-rf-green-deep">
            {referrals.length}
          </span>
        </div>
        {referrals.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No invites yet</EmptyTitle>
              <EmptyDescription>
                Once someone signs up through your link, they'll show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {referrals.map((r) => (
              <ReferralRow key={r.userId} referral={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
