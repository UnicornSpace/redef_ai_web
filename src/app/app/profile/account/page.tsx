import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/server";
import { HouseIcon, PanelsTopLeftIcon, SettingsIcon } from "lucide-react";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";

const AccountPage = async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.user_metadata?.email as string | undefined;
  const emailVerified = Boolean(data?.claims.user_metadata?.email_verified);

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Account"
        description="Your Redef AI account details."
      />
      <Tabs
        className="w-full flex-row"
        defaultValue="tab-1"
        orientation="vertical"
      >
        <div className="border-s">
          <TabsList variant="underline">
            <TabsTab value="tab-1">
              <HouseIcon aria-hidden="true" />
              Overview
            </TabsTab>
            <TabsTab value="tab-2">
              <PanelsTopLeftIcon aria-hidden="true" />
              Projects
            </TabsTab>
            <TabsTab value="tab-3">
              <SettingsIcon aria-hidden="true" />
              Settings
            </TabsTab>
          </TabsList>
        </div>
        <TabsPanel value="tab-1">
          <p className="p-4 text-center text-muted-foreground text-xs">
            Overview content
          </p>
        </TabsPanel>
        <TabsPanel value="tab-2">
          <p className="p-4 text-center text-muted-foreground text-xs">
            Projects content
          </p>
        </TabsPanel>
        <TabsPanel value="tab-3">
          <p className="p-4 text-center text-muted-foreground text-xs">
            Settings content
          </p>
        </TabsPanel>
      </Tabs>
      <div className="px-4 pb-10 md:px-8">
        <div className="flex max-w-md flex-col gap-4 rounded-2xl border border-line bg-paper p-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
              Email
            </span>
            <span className="text-base font-medium text-ink">
              {email ?? "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
              Email verified
            </span>
            <span
              className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ${
                emailVerified
                  ? "bg-g-green-pale text-rf-green-deep"
                  : "bg-[rgba(255,106,85,0.12)] text-rf-coral"
              }`}
            >
              {emailVerified ? "Yes" : "No"}
            </span>
          </div>
          <div className="pt-2">
            <LogoutButton />
          </div>
        </div>
        <div className="mt-4 flex max-w-md flex-col gap-2">
          <Link
            href="/app/profile/personalization"
            className="flex w-fit items-center gap-1 text-sm font-semibold text-rf-green-deep hover:underline"
          >
            Personalize how Redef talks to you →
          </Link>
          <Link
            href="/app/profile/referral"
            className="flex w-fit items-center gap-1 text-sm font-semibold text-rf-green-deep hover:underline"
          >
            Invite friends with your referral link →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
