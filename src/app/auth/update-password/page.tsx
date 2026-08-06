import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
  return (
    <AuthShell title="Set a new password" subtitle="Almost there.">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
