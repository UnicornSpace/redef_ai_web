import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell title="Sorry, something went wrong">
      <div className="flex flex-col items-center gap-5">
        <p className="text-center text-sm text-body-muted">
          {params?.error
            ? `Error code: ${params.error}`
            : "An unspecified error occurred."}
        </p>
        <Button render={<Link href="/auth/login" />} className="w-full">
          Back to login
        </Button>
      </div>
    </AuthShell>
  );
}
