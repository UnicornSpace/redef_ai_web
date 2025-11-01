import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/server";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
export default async function ({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  console.log("from layout (ai)");
  console.log(data, error);
  console.log("from layout (ai) - end");
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  return (
    <div>
      <SidebarProvider open={false}>
        <AppSidebar />
        {/* <SidebarInset className="bg-[#F1EDE7]"> */}
        {/* <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header> */}
        {children}
        {/* </SidebarInset> */}
      </SidebarProvider>
    </div>
  );
}
