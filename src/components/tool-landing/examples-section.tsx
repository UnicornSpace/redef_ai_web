import type { ToolConfig } from "@/lib/tools-config";

interface ExamplesSectionProps {
  tool: ToolConfig;
}

export function ExamplesSection({ tool }: ExamplesSectionProps) {
  if (!tool.examples || tool.examples.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <div>
        <h2
          className="f-h2"
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)" }}
        >
          Real examples
        </h2>
        <p className="f-body" style={{ marginTop: "0.5rem" }}>
          See how different people use this tool.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        {tool.examples.map((example) => (
          <article
            key={example.title}
            className="f-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid var(--line)",
              background: "#fff",
            }}
          >
            {/* Title */}
            <h3
              className="f-panel-title"
              style={{ fontSize: "1.05rem", fontWeight: 700 }}
            >
              {example.title}
            </h3>

            {/* Before/After if available */}
            {(example.before || example.after) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: example.before && example.after ? "1fr 1fr" : "1fr",
                  gap: "1rem",
                  padding: "1rem",
                  background: "var(--paper)",
                  borderRadius: "8px",
                }}
              >
                {example.before && (
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--body-muted)",
                        textTransform: "uppercase",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Before
                    </div>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--body)",
                      }}
                    >
                      {example.before}
                    </p>
                  </div>
                )}
                {example.after && (
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--rf-green-deep)",
                        textTransform: "uppercase",
                        marginBottom: "0.5rem",
                      }}
                    >
                      After
                    </div>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--body)",
                      }}
                    >
                      {example.after}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <p
              className="f-body"
              style={{
                fontSize: "0.9rem",
                color: "var(--body)",
                lineHeight: 1.5,
              }}
            >
              {example.description}
            </p>

            {/* Keywords */}
            {example.keywords && example.keywords.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                }}
              >
                {example.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.55rem",
                      borderRadius: "4px",
                      background: "var(--paper)",
                      color: "var(--body-muted)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
