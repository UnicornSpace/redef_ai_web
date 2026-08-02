# Tool Configuration Template

Use this as a starting point when adding a new tool. Copy and customize all sections.

## Step 1: Create Tool Configuration

Add this to `src/lib/tools-config.ts`:

```typescript
// ============================================================
// [TOOL_NAME] Tool Configuration
// ============================================================

export const [toolIdConfig]: ToolConfig = {
  // Basic identification
  id: "[tool-id]",                          // kebab-case, unique ID
  slug: "[tool-slug]",                      // URL slug
  name: "[Tool Name]",                      // Display name
  title: "[Tool Name] | SEO Title",        // Page title (55-65 chars)
  tagline: "One-line value proposition",    // Hero tagline
  description: "[155-160 char meta description]",

  // Long-form SEO content
  longDescription: `
    # [Tool Name] — Complete Guide

    ## What is [Tool Name]?
    
    [Explain the tool, its purpose, and benefits in 1500-2500 words]
    
    ## How It Works
    
    [Detailed explanation of the workflow]
    
    ## Why [Tool Name] Stands Out
    
    [Differentiation from competitors]
    
    ## Who Should Use It?
    
    [Target audiences and use cases]
    
    ## Tips & Best Practices
    
    [Helpful guidance for getting the most out of the tool]
  `,

  // Keywords for SEO
  keywords: [
    "[primary keyword]",
    "[secondary keyword 1]",
    "[secondary keyword 2]",
    "[long-tail keyword]",
  ],
  primaryKeyword: "[primary keyword]",
  secondaryKeywords: [
    "[secondary keyword 1]",
    "[secondary keyword 2]",
  ],

  // ============================================================
  // Hero Section
  // ============================================================
  
  heroTagline: "Build/Create/Generate your [outcome]",
  heroCTA: "Use Tool",           // Primary button text
  heroCTASecondary: "How it works", // Secondary button text
  thumbnailUrl: "/thumbnails/[tool-name].png", // 16:9 ratio
  trustBadges: [
    "Free · No sign-up",
    "No data collection",
    "[Key differentiator]",
  ],

  // ============================================================
  // Social Proof (optional)
  // ============================================================
  
  userCount: "5,000+",
  rating: 4.8,
  testimonials: [
    {
      text: "Powerful feedback about the tool.",
      author: "User Name",
      role: "Role/Industry",
      image: "/avatars/user-1.png", // Optional
    },
    {
      text: "Another testimonial highlighting specific value.",
      author: "Another User",
      role: "Role/Industry",
    },
  ],

  // ============================================================
  // Problem & Solution
  // ============================================================
  
  problemStatement: `
    Users struggle with [specific problem]. 
    Existing tools [limitation 1], [limitation 2], 
    and [limitation 3], making it hard to [desired outcome].
  `,

  solutionStatement: `
    [Tool Name] solves this by providing 
    [solution approach 1], [solution approach 2], 
    and [solution approach 3]. No sign-up, 
    no complicated setup — just [value].
  `,

  // ============================================================
  // Benefits (6-8 cards highlighting outcomes)
  // ============================================================
  
  benefits: [
    {
      title: "Benefit Title 1",
      description: "Outcome-focused description of why this matters.",
      icon: "lightning", // See BenefitsGrid for icon names
    },
    {
      title: "Benefit Title 2",
      description: "Another outcome users care about.",
      icon: "customize",
    },
    {
      title: "Benefit Title 3",
      description: "Third key benefit.",
      icon: "chart",
    },
    {
      title: "Benefit Title 4",
      description: "Fourth benefit.",
      icon: "private",
    },
    {
      title: "Benefit Title 5",
      description: "Fifth benefit.",
      icon: "heart",
    },
    {
      title: "Benefit Title 6",
      description: "Sixth benefit.",
      icon: "lightbulb",
    },
  ],

  // ============================================================
  // Features (7-10 detailed feature cards)
  // ============================================================
  
  features: [
    {
      title: "Feature Name 1",
      description: "What it does and why it matters to users.",
    },
    {
      title: "Feature Name 2",
      description: "Another capability with context.",
    },
    {
      title: "Feature Name 3",
      description: "Third feature benefit.",
    },
    {
      title: "Feature Name 4",
      description: "Fourth feature.",
    },
    {
      title: "Feature Name 5",
      description: "Fifth feature.",
    },
    {
      title: "Feature Name 6",
      description: "Sixth feature.",
    },
    {
      title: "Feature Name 7",
      description: "Seventh feature.",
    },
    {
      title: "Feature Name 8",
      description: "Eighth feature.",
    },
  ],

  // ============================================================
  // Real Examples (2-4 before/after scenarios)
  // ============================================================
  
  examples: [
    {
      title: "Example Use Case 1",
      before: "Without tool: [What users had to do manually]",
      after: "With tool: [What they achieve now, faster/better]",
      description: "Real scenario showing specific benefit.",
      keywords: ["use-case-1", "benefit"],
    },
    {
      title: "Example Use Case 2",
      before: "Without tool: [Previous workflow]",
      after: "With tool: [Improved outcome]",
      description: "Another real-world scenario.",
      keywords: ["use-case-2", "industry-term"],
    },
    {
      title: "Example Use Case 3",
      description: "Description without before/after if more appropriate.",
      keywords: ["use-case-3"],
    },
  ],

  // ============================================================
  // Use Cases by Audience (4-6 audiences)
  // ============================================================
  
  useCases: [
    {
      audience: "Students & Learners",
      description: "How this tool helps students achieve their goals.",
      examples: [
        "Use case example 1",
        "Use case example 2",
        "Use case example 3",
      ],
    },
    {
      audience: "Professionals",
      description: "How professionals benefit from this tool.",
      examples: [
        "Professional use case 1",
        "Professional use case 2",
      ],
    },
    {
      audience: "Creative Teams",
      description: "How creative professionals use this tool.",
      examples: [
        "Creative use case 1",
        "Creative use case 2",
      ],
    },
    {
      audience: "Teams & Organizations",
      description: "How teams collaborate with this tool.",
      examples: [
        "Team use case 1",
        "Team use case 2",
      ],
    },
    {
      audience: "Individuals",
      description: "How solo users benefit from this tool.",
      examples: [
        "Personal use case 1",
        "Personal use case 2",
      ],
    },
  ],

  // ============================================================
  // FAQ (20-30 SEO-optimized questions)
  // ============================================================
  
  faqs: [
    {
      q: "Is [Tool Name] really free?",
      a: "Yes, completely free. No hidden costs, no premium features locked behind a paywall.",
    },
    {
      q: "Do I need an account?",
      a: "No. Use it directly — no sign-up, no login, no data collection.",
    },
    {
      q: "Does [Tool Name] collect my data?",
      a: "No. Everything happens in your browser. No server uploads, no tracking, no analytics.",
    },
    {
      q: "How do I get started?",
      a: "Open the tool, [brief steps], and you're done. Takes under a minute.",
    },
    {
      q: "Can I [common feature question]?",
      a: "Yes, and here's how: [explanation with example].",
    },
    {
      q: "What file formats does it support?",
      a: "List supported formats with context.",
    },
    {
      q: "Is there a mobile app?",
      a: "Web version works on all devices. Native apps available on [platforms].",
    },
    {
      q: "How accurate is [Tool Name]?",
      a: "Explain accuracy, limitations, and use cases.",
    },
    {
      q: "Can I use this for [commercial use case]?",
      a: "Yes/No with explanation and alternatives if applicable.",
    },
    {
      q: "What if [common concern]?",
      a: "Reassurance and solution to concern.",
    },
    // Add 20-30 total questions covering:
    // - Feature questions (how to use specific features)
    // - Comparison questions (vs competitors)
    // - Technical questions (formats, compatibility)
    // - Privacy/data questions (builds trust)
    // - Pricing/free questions
    // - Use case questions (different applications)
    // - Integration questions (does it work with X?)
    // - Limitation questions (what it doesn't do)
  ],

  // ============================================================
  // Links & CTAs
  // ============================================================
  
  toolUrl: "/tools/[tool-slug]/tool",
  playStoreUrl: "https://play.google.com/store/apps/details?id=...",
  appStoreUrl: "https://apps.apple.com/app/...",

  // ============================================================
  // Related Tools (optional)
  // ============================================================
  
  relatedToolIds: [
    // "another-tool-id",
    // "third-tool-id",
  ],

  // ============================================================
  // SEO & Social Media
  // ============================================================
  
  canonicalUrl: "/tools/[tool-slug]",
  ogImage: "/thumbnails/[tool-name].png",
  twitterHandle: "@redefai", // Optional
};

// Add to registry
export const toolConfigs: Record<string, ToolConfig> = {
  [habitTrackerConfig.id]: habitTrackerConfig,
  [[toolIdConfig].id]: [toolIdConfig],  // ← Add your tool here
};
```

## Step 2: Create Page File

Create `src/app/(public)/tools/[tool-slug]/page.tsx`:

```typescript
import type { Metadata } from "next";
import { [toolIdConfig] } from "@/lib/tools-config";
import { generateToolMetadata } from "@/lib/tool-metadata";
import { ToolLandingTemplate } from "@/components/tool-landing/tool-landing-template";

export const metadata: Metadata = generateToolMetadata([toolIdConfig]);

export default function [ToolName]LandingPage() {
  return <ToolLandingTemplate tool={[toolIdConfig]} />;
}
```

## Step 3: Add Assets

1. **Thumbnail** → `/public/thumbnails/[tool-name].png`
   - Size: 16:9 aspect ratio (e.g., 1000×560px)
   - Format: PNG
   - Purpose: Product screenshot/hero image

2. **OG Image** → Same as thumbnail or custom `/public/thumbnails/[tool-name].png`
   - Size: 1200×630px (or 16:9)
   - Format: PNG or JPG
   - Purpose: Social media sharing preview

## Step 4: Create Tool Page

Create `src/app/(public)/tools/[tool-slug]/tool/page.tsx` with your interactive tool implementation.

## Content Writing Tips

### Problem Statement
- Start with the pain point users experience
- Quantify the problem if possible
- Explain why existing solutions fall short
- Example: "Designers spend 2+ hours daily searching stock photos, jumping between tools, and managing files manually."

### Solution Statement
- Lead with what users get
- Use benefit-focused language
- Keep it action-oriented
- Example: "Generate perfect product photos in 60 seconds. AI-powered, API-ready, no design skills needed."

### Benefits vs Features
- **Benefit**: What the user gets (outcome)
- **Feature**: What the tool does (capability)

Examples:
- ✓ Benefit: "Save 30 minutes daily" → ✗ Feature: "Fast processing"
- ✓ Benefit: "Build anywhere, no setup" → ✗ Feature: "Works offline"
- ✓ Benefit: "Professional results instantly" → ✗ Feature: "AI-powered"

### FAQ Writing
- Use natural language, conversational tone
- Include keyword variants naturally
- Answer the full question, not just yes/no
- Provide actionable advice
- Build trust by addressing concerns

### Examples
- Make them specific and relatable
- Show real results, not hypothetical
- Use quantifiable improvements where possible
- Cover different user personas

## SEO Checklist

- [ ] H1 includes primary keyword (55-65 characters)
- [ ] Meta description is 155-160 characters
- [ ] Primary keyword appears in first 100 words
- [ ] Semantic HTML structure (article, section, h2, h3)
- [ ] Internal links to related tools
- [ ] Alt text on all images
- [ ] Mobile-responsive (test on phone)
- [ ] Page loads in <3 seconds (check PageSpeed)
- [ ] All forms are accessible
- [ ] Schema markup validates (use Rich Results Test)

## File Naming

- `toolIdConfig` → Use camelCase for config names
- `[tool-slug]` → Use kebab-case for URLs and folder names
- Image files → Use lowercase, hyphens: `my-tool-name.png`

## Common Mistakes to Avoid

1. ❌ Using feature-focused benefits ("Fast processing") → ✓ Use outcome-focused ("Save 30 minutes daily")
2. ❌ Keyword stuffing → ✓ Write naturally with 2-3% keyword density
3. ❌ Identical meta descriptions → ✓ Make each unique and compelling
4. ❌ Missing alt text on images → ✓ Write descriptive, keyword-relevant alt text
5. ❌ Thin content (<1000 words) → ✓ Write substantial, helpful content (1500-2500 words)
6. ❌ Broken internal links → ✓ Link to other tools in your suite
7. ❌ Outdated screenshots → ✓ Keep visuals fresh and up-to-date
8. ❌ No social proof → ✓ Add testimonials, user counts, ratings

## Questions?

Refer to `TOOL_LANDING_PAGES.md` for detailed guidelines and best practices.
