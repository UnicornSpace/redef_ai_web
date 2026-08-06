import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Takes a few seconds — no credit card needed."
    >
      <Suspense fallback={null}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
