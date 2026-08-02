import type { ToolConfig } from "@/lib/tools-config";

interface ProblemSolutionProps {
  tool: ToolConfig;
}

export function ProblemSolution({ tool }: ProblemSolutionProps) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "2rem",
      }}
    >
      {/* Problem card */}
      <div
        className="f-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1.8rem",
          borderRadius: "12px",
          border: "2px solid var(--line)",
        }}
      >
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--ink)",
          }}
        >
          The Problem
        </h3>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--body)",
            lineHeight: 1.6,
          }}
        >
          {tool.problemStatement}
        </p>
      </div>

      {/* Solution card */}
      <div
        className="f-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1.8rem",
          borderRadius: "12px",
          background: "var(--paper)",
          border: "2px solid var(--rf-green)",
        }}
      >
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--rf-green-deep)",
          }}
        >
          The Solution
        </h3>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--body)",
            lineHeight: 1.6,
          }}
        >
          {tool.solutionStatement}
        </p>
      </div>
    </section>
  );
}
