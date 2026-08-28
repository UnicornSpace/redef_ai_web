"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signInWithOAuth } from "@/actions/auth";
import { GoogleIcon } from "@/components/auth/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";

function isSafeReturnPath(value: string | null): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//");
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const loginHref = isSafeReturnPath(redirectParam)
    ? `/auth/login?redirect=${encodeURIComponent(redirectParam)}`
    : "/auth/login";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const returnTo = isSafeReturnPath(redirectParam)
        ? redirectParam
        : "/app/talk";
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${returnTo}`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsOAuthLoading(true);
    setError(null);
    try {
      const res = await signInWithOAuth("google");
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
        setIsOAuthLoading(false);
        return;
      }
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setError("Something went wrong starting sign-up. Please try again.");
      setIsOAuthLoading(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the server. Check your connection and try again.",
      );
      toast.error("Couldn't start Google sign-in — check your connection.");
      setIsOAuthLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-5", className)} {...props}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isOAuthLoading}
      >
        <GoogleIcon />
        {isOAuthLoading ? "Redirecting to Google..." : "Continue with Google"}
      </Button>
      {error && <p className="text-center text-sm text-rf-coral">{error}</p>}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-paper px-2 text-body-muted">or</span>
        </div>
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repeat-password">Repeat password</Label>
          <Input
            id="repeat-password"
            type="password"
            required
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating your account..." : "Sign up"}
        </Button>
      </form>
      <p className="text-center text-sm text-body-muted">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-semibold text-ink underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
