"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReferralClient({
  code,
  referralPath,
}: {
  code: string;
  referralPath: string;
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
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
            Your referral code
          </span>
          <span className="text-2xl font-extrabold tracking-wide text-ink">
            {code}
          </span>
        </div>
        <div className="flex gap-2">
          <Input value={referralUrl} readOnly className="text-sm" />
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className="text-xs text-body-muted">
          Share this link with friends. We're still building out rewards and
          signup tracking for referrals — for now, this is just your unique
          link.
        </p>
      </div>
    </div>
  );
}
