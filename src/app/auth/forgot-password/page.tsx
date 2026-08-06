import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to get back in."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
