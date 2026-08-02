/**
 * Template generators to help create new tool configs faster
 * Use these as starting points and customize
 */

import type { ToolConfig, ToolFeature, ToolFAQ, ToolUseCase } from "./tools-config";

/**
 * Generic FAQ templates for productivity tools
 */
export const genericToolFAQs: ToolFAQ[] = [
  {
    q: "Is [TOOL_NAME] free?",
    a: "Yes, completely free. No hidden costs, no premium tiers, no data selling.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. Use it directly in your browser. No sign-up, no login, no email required.",
  },
  {
    q: "Does [TOOL_NAME] collect my data?",
    a: "No. Everything happens in your browser. Nothing is sent to our servers. Your privacy is protected.",
  },
  {
    q: "What file formats are supported?",
    a: "See the features section for detailed format support. Most common formats are supported.",
  },
  {
    q: "Is there a mobile app?",
    a: "The web version works on all devices. A native mobile app is available on iOS and Android.",
  },
  {
    q: "How accurate is [TOOL_NAME]?",
    a: "Accuracy depends on input quality. See the features and limitations for specific details.",
  },
  {
    q: "Can I use this for commercial purposes?",
    a: "Yes. You can use generated outputs for commercial projects without restrictions.",
  },
  {
    q: "How do I get support?",
    a: "Check the FAQ section first. For other questions, reach out to our support team.",
  },
  {
    q: "Does [TOOL_NAME] work offline?",
    a: "The web version requires an internet connection. Mobile apps work offline.",
  },
  {
    q: "How often is [TOOL_NAME] updated?",
    a: "We regularly add features and improvements based on user feedback.",
  },
  {
    q: "Can I save my work?",
    a: "Yes. Download results in supported formats or use browser storage for session data.",
  },
  {
    q: "Is there a way to undo/redo actions?",
    a: "Yes. Use Ctrl+Z (Cmd+Z on Mac) to undo and Ctrl+Shift+Z to redo.",
  },
  {
    q: "Can I share my work with others?",
    a: "Yes. Download and share the generated files, or use the built-in sharing features.",
  },
  {
    q: "What if something breaks?",
    a: "Refresh the page to reload. If the issue persists, clear your browser cache and try again.",
  },
  {
    q: "Can I import data from other tools?",
    a: "[TOOL_NAME] supports importing from CSV, JSON, and other standard formats.",
  },
];

/**
 * Generic benefit templates
 */
export const genericBenefits: ToolFeature[] = [
  {
    title: "Save Time Daily",
    description: "Cut down on repetitive tasks and get results in minutes instead of hours.",
  },
  {
    title: "No Setup Required",
    description: "Open and use immediately. No installation, no configuration, no learning curve.",
  },
  {
    title: "Completely Free",
    description: "No subscription, no freemium upsell, no hidden costs. Use forever at no charge.",
  },
  {
    title: "Privacy First",
    description: "Your data stays with you. Nothing is sent to servers or tracked.",
  },
  {
    title: "Mobile Friendly",
    description: "Works seamlessly on phone, tablet, and desktop. Responsive design included.",
  },
  {
    title: "Professional Quality",
    description: "Generate production-ready outputs that look polished and professional.",
  },
  {
    title: "Works Everywhere",
    description: "Cross-platform compatible. Windows, Mac, Linux, iOS, Android — no barriers.",
  },
  {
    title: "Community Driven",
    description: "Built for real users. Your feedback shapes what we build next.",
  },
];

/**
 * Generic use cases for productivity tools
 */
export const genericUseCases: ToolUseCase[] = [
  {
    audience: "Students & Learners",
    description: "Streamline academic work and improve learning outcomes.",
    examples: ["Study planning", "Assignment management", "Research organization"],
  },
  {
    audience: "Professionals",
    description: "Boost workplace productivity and streamline workflows.",
    examples: [
      "Project management",
      "Team collaboration",
      "Time optimization",
    ],
  },
  {
    audience: "Entrepreneurs",
    description: "Grow your business with tools designed for founders and startups.",
    examples: ["Workflow automation", "Team coordination", "Growth tracking"],
  },
  {
    audience: "Creatives",
    description: "Enhance creative workflows and bring ideas to life faster.",
    examples: ["Design planning", "Content creation", "Portfolio building"],
  },
  {
    audience: "Teams & Organizations",
    description: "Collaborate better and ship faster with team features.",
    examples: ["Team projects", "Shared workflows", "Real-time collaboration"],
  },
  {
    audience: "Individual Users",
    description: "Get things done and stay organized in your personal projects.",
    examples: [
      "Personal projects",
      "Side hustles",
      "Hobby management",
    ],
  },
];

/**
 * Common feature descriptions
 */
export const featureDescriptionTemplates = {
  customizable:
    "Tailor every aspect to your exact needs. No rigid templates or one-size-fits-all solutions.",
  fastPerformance:
    "Instant results without waiting. Optimized for speed and efficiency.",
  easyToUse:
    "Intuitive interface designed for everyone. No technical skills required.",
  collaborative:
    "Share and work together in real-time. Perfect for teams of any size.",
  accessible:
    "Works for everyone. Full keyboard support, screen reader friendly, and WCAG compliant.",
  opensource:
    "Source code available for transparency and community contributions.",
  integrations:
    "Connect with your existing tools. API available for custom integrations.",
  analytics:
    "Track metrics and get insights. Data-driven decisions made easy.",
  automation:
    "Reduce manual work. Automate repetitive tasks and save countless hours.",
  templates:
    "Get started instantly with pre-built templates. Customize or start from scratch.",
};

/**
 * Generate common SEO keywords for productivity tools
 */
export const generateProductivityKeywords = (toolName: string) => [
  `free ${toolName}`,
  `${toolName} online`,
  `${toolName} tool`,
  `best ${toolName}`,
  `${toolName} generator`,
  `online ${toolName}`,
  `${toolName} maker`,
  `easy ${toolName}`,
  `quick ${toolName}`,
  `${toolName} no signup`,
];

/**
 * Template for a minimal but complete tool config
 */
export const minimalToolTemplate: Partial<ToolConfig> = {
  // Basics
  id: "new-tool",
  slug: "new-tool",
  name: "New Tool",
  title: "New Tool | Online Generator | Free No Signup",
  tagline: "Create [outcome] in seconds",
  description: "Free online tool to [verb] [object]. No sign-up, no account needed.",

  // SEO
  keywords: ["new tool", "free online", "no signup"],
  primaryKeyword: "new tool",

  // Hero
  heroTagline: "Create [outcome] instantly",
  heroCTA: "Start Now",
  heroCTASecondary: "How it works",
  thumbnailUrl: "/thumbnails/new-tool.png",
  trustBadges: ["Free forever", "No sign-up", "Private"],

  // Social Proof (optional, remove if not applicable)
  userCount: "1,000+",
  rating: 4.5,

  // Problem & Solution
  problemStatement: "Users struggle with [problem] because [limitation].",
  solutionStatement: "[Tool] solves this by providing [solution] in [timeframe].",

  // CTAs
  toolUrl: "/tools/new-tool/tool",
  canonicalUrl: "/tools/new-tool",
  ogImage: "/thumbnails/new-tool.png",
};

/**
 * Helper to scaffold a new tool config with common values
 */
export function createToolScaffold(
  id: string,
  name: string,
  verb: string,
  object: string
): Partial<ToolConfig> {
  return {
    id,
    slug: id,
    name,
    title: `${name} | Free Online ${name} | No Signup`,
    tagline: `${verb} ${object} in seconds`,
    description: `Free online ${name}. ${verb} ${object} instantly. No sign-up, no account, no catch.`,
    keywords: [
      `${name.toLowerCase()}`,
      `free ${name.toLowerCase()}`,
      `online ${name.toLowerCase()}`,
      `${verb.toLowerCase()} ${object.toLowerCase()}`,
    ],
    primaryKeyword: `${name.toLowerCase()}`,
    heroTagline: `${verb} ${object} instantly`,
    heroCTA: "Get Started",
    thumbnailUrl: `/thumbnails/${id}.png`,
    toolUrl: `/tools/${id}/tool`,
    canonicalUrl: `/tools/${id}`,
    ogImage: `/thumbnails/${id}.png`,
  };
}

/**
 * Example: Create a tool config for a "Resume Generator"
 */
export function exampleResumeGeneratorScaffold() {
  return createToolScaffold(
    "resume-generator",
    "Resume Generator",
    "Build",
    "a professional resume"
  );
}

/**
 * Common problem statement templates
 */
export const problemStatementTemplates = {
  timeConsuming: `Creating [object] manually takes hours. Users struggle with [specific pain point],
    forcing them to choose between [tradeoff 1] and [tradeoff 2].`,

  complexity: `[Object] creation is too complex. Most tools have a steep learning curve, requiring
    [skill 1], [skill 2], and [skill 3] to get results.`,

  cost: `Quality [object] tools are expensive. Freelancers charge $[amount], and enterprise software
    costs thousands per month. There's no affordable middle ground.`,

  noControl: `Existing [object] makers force you into rigid templates. You can't customize [feature 1],
    adjust [feature 2], or [feature 3]. One size fits none.`,

  scattered: `Creating [object] requires jumping between multiple tools. You need [tool 1] for [task 1],
    [tool 2] for [task 2], and [tool 3] for [task 3]. It's exhausting.`,
};

/**
 * Common solution statement templates
 */
export const solutionStatementTemplates = {
  fast: `[Tool Name] generates perfect [objects] in seconds. No complex menus, no learning curve —
    just [action 1], [action 2], and [action 3]. Done.`,

  simple: `We stripped away the complexity. Create [objects] without [limitation 1], [limitation 2],
    or [limitation 3]. Pure simplicity, real results.`,

  free: `Completely free. No subscriptions, no upsells, no "premium" restrictions. Create as many
    [objects] as you want, forever, at zero cost.`,

  flexible: `Fully customizable. [Feature 1], [feature 2], [feature 3] — adjust everything to your exact needs.
    No templates, no compromises.`,

  unified: `One tool, everything you need. [Action 1], [action 2], and [action 3] — all in one place.
    No jumping between tabs. No context switching.`,
};
