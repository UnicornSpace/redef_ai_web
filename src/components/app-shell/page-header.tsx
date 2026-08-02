import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Consistent header for every /app dashboard subpage — title + optional
 * description, in the same brand type scale used across the marketing site.
 * Relies on the `.redef` scope (applied in app/layout.tsx) for CSS vars.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 pt-8 pb-2 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-balance text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
          {title}
        </h1>
        {actions}
      </div>
      {description ? (
        <p className="max-w-xl text-pretty text-sm text-body-muted md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Placeholder panel for /app features that are still under construction.
 * Keeps unfinished routes from looking broken while v2 is being built out.
 */
export function ComingSoonPanel({
  icon: Icon,
  title,
  blurb,
}: {
  icon?: LucideIcon;
  title: string;
  blurb: string;
}) {
  return (
    <div className="mx-4 my-4 flex flex-col items-center gap-3 rounded-3xl border border-line bg-paper px-6 py-14 text-center md:mx-8">
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-white text-ink shadow-sm">
          <Icon size={22} />
        </span>
      ) : null}
      <span className="rounded-full bg-g-green-pale px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-rf-green-deep">
        Coming soon
      </span>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <p className="max-w-sm text-sm text-body-muted">{blurb}</p>
    </div>
  );
}

/** Row of small stat-tile skeletons (dashboard/finance/deep-work stat rows). */
export function StatTilesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-3 px-4 pb-4 md:px-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`stat-${i}`}
          className="flex-1 rounded-2xl border border-line bg-paper p-4"
        >
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Bordered card of skeleton rows (list-style pages: tasks, history logs). */
export function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="px-4 md:px-8">
      <div className="rounded-2xl border border-line bg-paper">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`row-${i}`}
            className={
              i !== rows - 1
                ? "flex items-center gap-3 border-b border-line px-3 py-2.5"
                : "flex items-center gap-3 px-3 py-2.5"
            }
          >
            <Skeleton className="size-4.5 shrink-0 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grid of skeleton cards (habits, challenges). */
export function CardGridSkeleton({
  cards = 4,
  columns = 2,
  className,
}: {
  cards?: number;
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <div className={cn(`px-4 md:px-8 `, className)}>
      <div
        className={
          columns === 2
            ? "grid grid-cols-1 gap-4 md:grid-cols-2"
            : "grid grid-cols-1 gap-4 md:grid-cols-3"
        }
      >
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={`card-${i}`}
            className="flex h-40 flex-col gap-3 rounded-2xl border border-line bg-paper p-4"
          >
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="mt-auto h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
