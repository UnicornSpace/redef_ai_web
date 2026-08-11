import type { Metadata } from "next";

/**
 * Drop into a page's `metadata` export to keep it out of search indexes
 * without deleting the route — used for orphaned experiments, investor-only
 * pages shared by direct link, and unfinished scaffolding that's currently
 * publicly reachable. robots.ts also disallows most of these paths, but
 * that's defense in depth: a `disallow` only stops crawling, it doesn't
 * guarantee a linked-to URL stays out of the index. This meta tag is the
 * mechanism that actually does.
 */
export const NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
