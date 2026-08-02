"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="flex w-full flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
      <p className="max-w-sm text-sm text-body-muted">
        That page hit an unexpected error. Try again, or head back to your
        dashboard.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button render={<a href="/app" />}>Go to dashboard</Button>
      </div>
    </div>
  );
}
