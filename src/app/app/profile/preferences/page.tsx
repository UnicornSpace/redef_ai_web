import { redirect } from "next/navigation";
import { getMyProfile } from "@/actions/profile";
import { PageHeader } from "@/components/app-shell/page-header";
import { PreferencesForm } from "@/components/profile/preferences-form";
import { DEFAULT_ENABLED_MODULES } from "@/lib/modules";

export default async function PreferencesPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/onboarding");

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Preferences"
        description="The details we collected during onboarding — change your age, phone number, or which tools are enabled any time."
      />
      <div className="flex flex-col gap-6 px-4 pb-16 md:px-8">
        <PreferencesForm
          defaultAgeRange={profile.age_range}
          defaultPhoneNumber={profile.phone_number}
          defaultEnabledModules={profile.enabled_modules ?? DEFAULT_ENABLED_MODULES}
        />
      </div>
    </div>
  );
}
