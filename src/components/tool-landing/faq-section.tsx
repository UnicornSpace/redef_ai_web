import type { ToolConfig } from "@/lib/tools-config";

interface FAQSectionProps {
  tool: ToolConfig;
}

export function FAQSection({ tool }: FAQSectionProps) {
  if (!tool.faqs || tool.faqs.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.3rem",
      }}
    >
      <h2
        className="f-h2"
        style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)" }}
      >
        Frequently asked questions
      </h2>

      <div className="faq-list">
        {tool.faqs.map((faq, idx) => (
          <details key={`${faq.q}-${idx}`} className="faq-item">
            <summary className="faq-summary">
              {faq.q}
              <span className="faq-plus" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="f-body" style={{ paddingTop: "0.6rem" }}>
              {faq.a}
            </p>
          </details>
        ))}
      </div>

      <style>{`
        .faq-list {
          display: flex;
          flex-direction: column;
        }
        .faq-item {
          border-bottom: 1px solid var(--line);
          padding: 1rem 0;
        }
        .faq-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          cursor: pointer;
          list-style: none;
          font-weight: 700;
          color: var(--ink);
        }
        .faq-summary::-webkit-details-marker {
          display: none;
        }
        .faq-plus {
          color: var(--body-muted);
          transition: transform 160ms ease;
          min-width: 20px;
          text-align: right;
        }
        .faq-item[open] .faq-plus {
          transform: rotate(45deg);
        }
      `}</style>
    </section>
  );
}
