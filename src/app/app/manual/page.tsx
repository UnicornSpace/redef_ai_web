import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { NOINDEX_METADATA } from "@/lib/seo";
import { MANUAL_SECTIONS, MANUAL_UPDATED } from "@/lib/manual-content";

/**
 * Internal manual — "what can Redef actually do". Not marketing, not
 * onboarding: a reference for whoever is building this, covering every
 * module, every route, and every capability the assistant has, so the
 * surface area is knowable without reading the source.
 *
 * Lives under /app so it's behind auth (it describes internals), but it's
 * deliberately absent from the sidebar and tab bar — it's reached from
 * Settings, not carried around in the main nav. Content lives in
 * src/lib/manual-content.ts so this file stays presentation-only.
 */
export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Manual | Redef AI",
};

export default function ManualPage() {
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Redef AI — internal manual"
        description="Every module, route, and thing you can ask Talk to do. Written for whoever's building this, not for end users."
      />

      <div className="flex flex-col gap-8 px-4 pb-16 md:px-8">
        <p className="text-xs text-body-muted">Last updated {MANUAL_UPDATED}</p>

        {/* Jump links — the page is long enough that landing at the top with
            no map is its own small failure. */}
        <nav className="flex flex-wrap gap-2">
          {MANUAL_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-body-muted transition-colors hover:border-rf-green-deep/40 hover:text-ink"
            >
              {section.title}
            </a>
          ))}
        </nav>

        {MANUAL_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="flex scroll-mt-8 flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-balance text-xl font-extrabold tracking-tight text-ink">
                {section.title}
              </h2>
              {section.intro ? (
                <p className="max-w-2xl text-pretty text-sm text-body-muted">
                  {section.intro}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              {section.entries.map((entry) => (
                <div
                  key={entry.name}
                  className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4 md:p-5"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-sm font-bold text-ink">{entry.name}</h3>
                    {entry.route ? (
                      <Link
                        href={entry.route}
                        className="rounded-md bg-g-green-pale px-1.5 py-0.5 font-mono text-xs text-rf-green-deep transition-opacity hover:opacity-80"
                      >
                        {entry.route}
                      </Link>
                    ) : null}
                    {entry.tag ? (
                      <span className="rounded-full bg-[rgba(55,50,47,0.06)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-body-muted">
                        {entry.tag}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-pretty text-sm text-body-muted">
                    {entry.description}
                  </p>

                  {entry.details && entry.details.length > 0 ? (
                    <ul className="flex flex-col gap-1.5 pl-4">
                      {entry.details.map((detail) => (
                        <li
                          key={detail}
                          className="list-disc text-pretty text-sm text-body-muted marker:text-rf-green-deep/50"
                        >
                          {detail}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {entry.examples && entry.examples.length > 0 ? (
                    <div className="flex flex-col gap-1.5 rounded-xl bg-white/60 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-body-muted">
                        Say it like this
                      </span>
                      {entry.examples.map((example) => (
                        <span
                          key={example}
                          className="text-pretty text-sm italic text-ink"
                        >
                          &ldquo;{example}&rdquo;
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
