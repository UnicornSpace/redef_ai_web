import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Link from "next/link";
import "@/styles/redef-theme.css";
import { MotionProvider } from "@/components/new-landing-page-components/shared";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://redefai.app";
const TITLE = "AI in Modern Pedagogy: A Practical Field Guide for Teachers and Students";
const DESCRIPTION =
  "A practical walkthrough of how AI actually shows up in classrooms today — ChatGPT Study Mode, NotebookLM, AI-generated slides and video, live screen-share tutoring, and the skills worth building instead of the ones AI quietly erodes.";
const PUBLISHED = "2026-08-21";

export const metadata: Metadata = {
  title: `${TITLE} | Redef AI`,
  description: DESCRIPTION,
  alternates: { canonical: "/blog/ai-in-modern-pedagogy" },
  authors: [{ name: "Faizan" }],
  openGraph: {
    type: "article",
    url: `${SITE_URL}/blog/ai-in-modern-pedagogy`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Redef AI",
    publishedTime: PUBLISHED,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

function ArticleSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    author: { "@type": "Person", name: "Faizan" },
    publisher: {
      "@type": "Organization",
      name: "Redef AI",
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/blog/ai-in-modern-pedagogy`,
  };
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function Callout({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="f-panel"
      style={{
        padding: "1.5rem 1.75rem",
        borderRadius: 16,
        border: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <span
        className="f-eyebrow"
        style={{ color: "var(--rf-green-deep)", fontSize: "0.85rem" }}
      >
        {eyebrow}
      </span>
      {children}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="f-h2"
      style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginTop: "0.5rem" }}
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="f-body" style={{ fontSize: "1.02rem", color: "var(--ink)" }}>
      {children}
    </p>
  );
}

export default function AiInModernPedagogyPost() {
  return (
    <div className={`redef ${manrope.className}`}>
      <ArticleSchema />
      <MotionProvider>
        <main className="f-container" style={{ padding: "3rem 0 5rem" }}>
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "2.25rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Link
                href="/tools"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  width: "fit-content",
                  fontSize: "0.9rem",
                  fontWeight: 650,
                  color: "var(--body-muted)",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={16} /> Back to Redef AI
              </Link>
              <span className="f-eyebrow" style={{ color: "var(--rf-green-deep)" }}>
                Teaching &amp; Learning
              </span>
              <h1 className="f-h1" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
                {TITLE}
              </h1>
              <p className="f-lede">{DESCRIPTION}</p>
              <p
                className="f-body"
                style={{ fontSize: "0.85rem", color: "var(--body-muted)" }}
              >
                By Faizan (
                <a
                  href="https://x.com/FaizanBuilds"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--rf-green-deep)" }}
                >
                  @FaizanBuilds
                </a>
                ) · Updated August 2026
              </p>
            </div>

            <div className="f-hr" />

            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <P>
                Most conversations about AI in education start from fear — of
                cheating, of shortcuts, of students who never learn to write a
                sentence without a model finishing it for them. That fear is
                real, but it's aimed at the wrong target. The question isn't
                whether students will use AI. They already do. The question is
                whether we spend our energy fighting that, or spend it figuring
                out how to use the same tools to enhance HI — human
                intelligence, human potential, and human purpose.
              </P>
              <P>
                That reframe changes what "using AI in the classroom" actually
                means. It's not a single tool or a single prompt. It's a
                toolkit — different tools for different moments in how a person
                learns — and a set of habits about which parts of the work you
                still do yourself. Below is a practical map of that toolkit,
                organized the way it actually gets used: what a student reaches
                for to learn something new, what a teacher reaches for to
                prepare and support, and what both of them should watch out
                for.
              </P>
            </div>

            <H2>The skills an AI-era classroom actually needs</H2>
            <P>
              Before the tools, the filter. Every new capability AI hands a
              student is worth asking one question about:{" "}
              <em>does this replace thinking, or does it remove friction so
              more thinking can happen?</em> A simple framework for sorting
              that out is <strong>AI Can / AI Can't / AI Needs</strong> —
              what the model is genuinely good at, what it still can't
              reliably do, and what it needs from the human on the other end
              of the conversation to be useful at all (context, judgment, a
              real question, and a plan for what happens with the answer).
              Held next to that framework, the skills worth deliberately
              building don't shrink in an AI-saturated classroom — they
              shift: critical thinking, communication, quick thinking,
              higher-order reasoning, and applied knowledge outrank
              memorization and rote recall, because AI already has the recall
              covered.
            </P>

            <H2>A new triangle: teacher, AI, and student</H2>
            <P>
              The clearest way to place AI in a classroom is to see it as a
              third point added to a relationship that used to have two. For
              the teacher, AI works as a{" "}
              <strong>teaching assistant</strong> — drafting materials,
              differentiating a lesson for different reading levels,
              generating practice sets, and handling the repetitive prep that
              eats hours nobody gets back. For the student, the same
              underlying models work as a <strong>personal tutor</strong> —
              available at 11pm before an exam, patient with a question asked
              five different ways, and scaled to one learner instead of thirty.
              Neither role replaces the teacher; both exist because a single
              teacher genuinely cannot be in thirty places, explaining a
              concept thirty different ways, at once.
            </P>

            <H2>Everyday learning with ChatGPT</H2>
            <P>
              The most common entry point is also the simplest: a chat window.
              Used well, it covers a surprising amount of ground —
              exploring and learning new topics conversationally, practicing a
              language with an infinitely patient partner, turning an abstract
              concept into a visualization (an ASCII diagram, a generated
              image, even a small interactive page) when words alone aren't
              landing, and quizzing yourself on material before a test instead
              of just re-reading notes and mistaking familiarity for mastery.
            </P>
            <Callout eyebrow="Study Mode, not answer mode">
              <P>
                ChatGPT's <strong>Study Mode</strong> is worth calling out on
                its own. Instead of handing over a finished answer, it walks a
                student through a problem step by step — closer to a Socratic
                tutor than a search engine. It's built specifically around{" "}
                <em>test prep and algorithmic thinking</em>: the kind of
                guided practice where getting to the answer matters less than
                being able to get there again, alone, next time.
              </P>
            </Callout>

            <H2>NotebookLM: turn any source into a full study kit</H2>
            <P>
              If there's one tool in this list that earns the label{" "}
              <em>"the last thing students and teachers need"</em> — in the
              best sense, as in the last new app you'll have to open — it's
              Google's <strong>NotebookLM</strong>. Feed it a source (a
              textbook chapter, a lecture recording, a set of research papers)
              and it turns that single source into an entire study kit: an
              audio overview you can listen to like a podcast, a video
              overview, a mind map of how the ideas connect, summary reports,
              flashcards, a quiz, an infographic, a slide deck, and even a
              structured data table — all generated from material the student
              or teacher already trusts, instead of a model's general
              knowledge of the topic.
            </P>

            <H2>Making the material itself: images, slides, and video</H2>
            <P>
              A lesson isn't just text, and AI's usefulness scales past the
              chat window once you bring in generation. Image models turn a
              rough idea — "illustrate the stages of cancer," "make an
              infographic explaining this process" — into a diagram a student
              actually looks at twice. Tools like <strong>Gamma</strong> and
              an AI-assisted Google Slides workflow take the template
              headache out of building a deck, generating a structured
              first draft from an outline instead of a blank canvas. And for
              anything that benefits from being watched rather than read,
              video generation tools like <strong>HeyGen</strong> and{" "}
              <strong>Veo 3</strong> can turn a script into an explainer video
              without a camera, a studio, or an editing timeline.
            </P>
            <P>
              For live, in-the-moment help, <strong>Google AI Studio</strong>{" "}
              adds a different kind of capability: sharing your screen with
              the model directly, so it can see the diagram you're stuck on or
              the code you're debugging in real time, rather than you
              describing it in text and hoping nothing gets lost in
              translation.
            </P>

            <H2>Building your own tools, not just using someone else's</H2>
            <P>
              Once the individual tools feel familiar, the next step is
              composing them. <strong>OpenAI's AgentBuilder</strong> lets a
              teacher or an institution wire several steps together into a
              single workflow — grading a rubric-based assignment,
              routing student questions to the right resource, generating a
              weekly summary for parents — without writing production
              software. It's the difference between using an AI feature and
              designing the workflow an AI feature sits inside of, which is
              ultimately the more durable skill for anyone building
              curriculum long-term.
            </P>

            <H2>What to do instead — and what you get for it</H2>
            <P>
              The most useful reframe in all of this is a simple substitution
              table: <strong>rather than</strong> outsourcing the parts of
              learning that build capability, <strong>do this</strong> instead
              — use AI to generate a first draft, then critique and rewrite
              it yourself; use it to explain a concept five ways, then explain
              it back in your own words; use it to check your reasoning after
              you've committed to an answer, not before. Held to that
              standard, the <strong>skills</strong> an AI-era education
              actually strengthens are exactly the ones worth strengthening:
              critical thinking, communication, quick thinking, higher-order
              reasoning, and applied knowledge — the skills that stay valuable
              precisely because they're the ones AI still can't do for you.
            </P>

            <H2>Where to go deeper</H2>
            <P>
              For educators and institutions building this out further,{" "}
              <a
                href="https://claude.com/solutions/education"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--rf-green-deep)", fontWeight: 600 }}
              >
                Claude for Education
              </a>{" "}
              and{" "}
              <a
                href="https://www.perplexity.ai/academic"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--rf-green-deep)", fontWeight: 600 }}
              >
                Perplexity Academic
              </a>{" "}
              are both worth a look — one focused on responsible use inside
              coursework, the other on research grounded in citable sources
              rather than an unsourced chat reply.
            </P>

            <div className="f-hr" />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              <p className="f-lede" style={{ fontSize: "1.05rem" }}>
                None of this replaces a teacher, and none of it replaces the
                effort of actually learning something. It just changes what's
                worth spending effort on — and gives both sides of the
                classroom a much faster feedback loop while they do it.
              </p>
              <Link
                href="/tools"
                className="f-btn f-btn-dark"
                style={{ textDecoration: "none" }}
              >
                Explore free tools →
              </Link>
            </div>
          </div>
        </main>
      </MotionProvider>
    </div>
  );
}
