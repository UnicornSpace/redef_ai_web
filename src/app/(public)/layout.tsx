import type { Metadata } from "next";
import "@/styles/redef-theme.css";
import { RedefFooter } from "@/components/new-landing-page-components/footer";
import { RedefNav } from "@/components/new-landing-page-components/nav";
import { createClient } from "@/lib/server";

export const metadata: Metadata = {
  title: "Redef AI",
  description: "Voice-first AI powered productivity system for your daily life",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const user = authUser?.email ? { email: authUser.email } : null;

  return (
    <div className="redef redef-surface">
      <RedefNav user={user} />
      <main>{children}</main>
      <RedefFooter user={user} />
    </div>
  );
}
