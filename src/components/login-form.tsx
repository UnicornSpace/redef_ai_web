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
  // only allow relative paths, never full URLs — prevents open-redirect abuse
  return !!value && value.startsWith("/") && !value.startsWith("//");
}
// import { supabase } from "@/lib/supabase-client";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectTo = isSafeReturnPath(redirectParam)
    ? redirectParam
    : "/app/talk";
  const signUpHref = isSafeReturnPath(redirectParam)
    ? `/auth/sign-up?redirect=${encodeURIComponent(redirectParam)}`
    : "/auth/sign-up";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push(redirectTo);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // This button previously called signInWithOAuth and did nothing with
    // the result — no loading state, no error surfaced. If the request
    // failed for any reason (network hiccup, an origin Supabase's
    // redirect-URL allowlist doesn't recognize, anything) the button just
    // looked broken: no spinner, no message, nothing. That silence was
    // the actual bug being reported, not just a coincidence alongside it.
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
        // A real cross-origin navigation to Google's consent screen —
        // router.push can't leave the app's own origin, only this can.
        // Deliberately not resetting isOAuthLoading here: the button
        // should stay in its loading state through the redirect rather
        // than flash back to normal for the instant before the browser
        // actually navigates away.
        window.location.href = res.url;
        return;
      }
      setError("Something went wrong starting sign-in. Please try again.");
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

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/auth/forgot-password"
              className="ml-auto text-xs text-body-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className="text-center text-sm text-body-muted">
        Don&apos;t have an account?{" "}
        <Link
          href={signUpHref}
          className="font-semibold text-ink underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
