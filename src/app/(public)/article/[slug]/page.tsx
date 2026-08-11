import type { Metadata } from "next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NOINDEX_METADATA } from "@/lib/seo";
import {
  RiLinkM,
  RiTimeLine,
  RiTwitterXLine,
  RiLinkedinBoxLine,
} from "react-icons/ri";

const tags = ["Engineering", "Performance", "Databases"];

// Hardcoded placeholder content regardless of [slug], no generateMetadata,
// not linked from anywhere. Noindexed until this is wired to real article
// data (see /blog for the matching gap on the index side).
export const metadata: Metadata = NOINDEX_METADATA;

export default function ArticleBlock() {
  return (
    <section className="flex min-h-svh w-full justify-center bg-background px-6 py-16 text-foreground">
      <article className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Badge variant="secondary">Engineering</Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            Jun 18, 2026
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          How we cut API latency by 60% in three weeks
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A look at the cold-read bottleneck that was quietly slowing every
          request, and the caching layer we built to fix it.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage
              src="https://i.pravatar.cc/80?img=45"
              alt="Lena Park"
              className="grayscale"
            />
            <AvatarFallback>LP</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Lena Park</span>
            <span className="text-xs text-muted-foreground">
              Staff Engineer
            </span>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <RiTimeLine className="size-3.5 shrink-0" aria-hidden="true" />7 Min
            Read
          </span>
        </div>

        <div className="mt-8 aspect-[16/9] w-full overflow-hidden border border-border bg-muted">
          <img
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80"
            alt="Server racks in a data center"
            className="size-full object-cover grayscale"
            loading="lazy"
          />
        </div>

        <div className="mt-8 flex flex-col gap-5 text-[15px]/relaxed text-foreground/80">
          <p>
            Our monolith was fast enough, until it wasn&apos;t. As traffic grew,
            p95 response times crept past a second and our dashboards lit up
            during every morning spike. The culprit was not the code we
            expected.
          </p>

          <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Finding the bottleneck
          </h2>
          <p>
            Tracing a single slow request end to end revealed that nearly every
            call hit the database for data that almost never changed. We were
            paying for cold reads on settings, feature flags, and plan limits
            thousands of times a minute.
          </p>

          <blockquote className="border-l-2 border-foreground/30 pl-4 text-foreground italic">
            &ldquo;The fastest query is the one you never make. Caching is not
            an optimization, it is a design decision.&rdquo;
          </blockquote>

          <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            The fix
          </h2>
          <p>
            We introduced a small read-through cache in front of the hot tables
            with a per-key TTL and explicit invalidation on writes. The rollout
            was gradual, table by table, so we could measure the impact at each
            step.
          </p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground/40">
            <li>p95 latency dropped from 980ms to 390ms</li>
            <li>Database load fell by roughly half at peak</li>
            <li>No change to application code beyond the cache wrapper</li>
          </ul>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-1 text-xs text-muted-foreground">Share</span>
            <Button variant="ghost" size="icon-sm" aria-label="Copy link">
              <RiLinkM aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Share on X">
              <RiTwitterXLine aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Share On LinkedIn"
            >
              <RiLinkedinBoxLine aria-hidden="true" />
            </Button>
          </div>
        </div>
      </article>
    </section>
  );
}
