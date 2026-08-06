import { redirect } from "next/navigation";
import { getMyProfile } from "@/actions/profile";
import { OnboardingClient } from "@/components/onboarding/onboarding-client";
import { createClient } from "@/lib/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/login?redirect=/onboarding");

  const profile = await getMyProfile();
  if (profile?.onboarded_at) redirect("/app");

  const email = data.claims.user_metadata?.email as string | undefined;
  const suggested =
    email
      ?.split("@")[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20) ?? "";

  return <OnboardingClient suggestedUsername={suggested} />;
}
