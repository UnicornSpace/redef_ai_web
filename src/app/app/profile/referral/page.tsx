import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { captureReferral } from "@/actions/chat";
import { PageHeader } from "@/components/app-shell/page-header";
import { ReferralClient } from "@/components/profile/referral-client";
import { createClient } from "@/lib/server";

export default async function ReferralPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth/login");

  // If the ReferralCapture client component dropped a cookie earlier
  // (either just now or on a prior /waitlist landing), persist it now
  // that we have an authenticated user. captureReferral is first-write-
  // wins so this stays safe on repeat visits.
  const cookieStore = await cookies();
  const captured = cookieStore.get("rf_ref")?.value;
  if (captured) {
    await captureReferral(captured);
  }

  const code = user.user.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Referral"
        description="Invite friends to Redef AI with your personal link."
      />
      <ReferralClient code={code} referralPath={`/?ref=${code}`} />
    </div>
  );
}
