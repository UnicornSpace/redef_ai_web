import { AuthShell } from "@/components/auth/auth-shell";

export default function Page() {
  return (
    <AuthShell title="Check your email" subtitle="You're almost in.">
      <p className="text-center text-sm text-body-muted">
        We've sent a confirmation link to your inbox. Click it to activate
        your account, then come back and log in.
      </p>
    </AuthShell>
  );
}
