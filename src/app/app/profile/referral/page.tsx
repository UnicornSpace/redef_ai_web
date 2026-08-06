import { redirect } from "next/navigation";
import { getMyReferrals } from "@/actions/chat";
import { PageHeader } from "@/components/app-shell/page-header";
import { ReferralClient } from "@/components/profile/referral-client";
import { createClient } from "@/lib/server";
import { AdmitOneTicket } from "@/components/referral-card";

export default async function ReferralPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth/login");

  const { code, referrals } = await getMyReferrals();

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Referral"
        description="Invite friends to Redef AI with your personal link."
      />
    
      <ReferralClient
        code={code}
        referralPath={`/?ref=${code}`}
        referrals={referrals}
      />
    </div>
  );
}
