# SEO Landing Page System for Tools

This document explains how to create and manage high-converting SEO landing pages for your productivity tools using the reusable template system.

## Overview

The tool landing page system is built on:

1. **Data-driven configuration** (`src/lib/tools-config.ts`) — Define your tool's metadata, content, FAQs, and examples once
2. **Reusable components** (`src/components/tool-landing/`) — Pre-built, composable sections
3. **Auto-generated metadata** (`src/lib/tool-metadata.ts`) — Proper SEO markup and social cards
4. **Flexible template** (`ToolLandingTemplate`) — Brings everything together with minimal code

## Structure

### 1. Tools Configuration (`src/lib/tools-config.ts`)

This is where all content lives. Define each tool as a `ToolConfig` object:

```typescript
export const myToolConfig: ToolConfig = {
  id: "my-tool-id",
  slug: "my-tool-slug",
  name: "My Tool",
  title: "My Tool | Long SEO Title",
  tagline: "One-line value proposition",
  description: "Short description for meta tags",
  longDescription: "1500-2500 word SEO-optimized content",
  keywords: ["keyword1", "keyword2"],
  primaryKeyword: "keyword1",
  
  // Hero section
  heroTagline: "Hero tagline",
  heroCTA: "Call to action button text",
  heroCTASecondary: "Secondary CTA",
  thumbnailUrl: "/path/to/thumbnail.png",
  trustBadges: ["Free", "No sign-up"],
  
  // Social proof
  userCount: "10,000+",
  rating: 4.8,
  testimonials: [
    {
      text: "Great tool!",
      author: "John Doe",
      role: "User",
    }
  ],
  
  // Content
  problemStatement: "Problem description",
  solutionStatement: "Solution description",
  
  // Features, benefits, examples, use cases, FAQs
  benefits: [...],
  features: [...],
  examples: [...],
  useCases: [...],
  faqs: [...],
  
  // Links
  toolUrl: "/tools/my-tool/tool",
  playStoreUrl: "https://play.google.com/...",
  
  // SEO
  canonicalUrl: "/tools/my-tool",
  ogImage: "/path/to/og-image.png",
};

// Register tool
export const toolConfigs: Record<string, ToolConfig> = {
  [myToolConfig.id]: myToolConfig,
};
```

### 2. Reusable Components

Each component handles one section of the landing page:

- **`HeroSection`** — H1, value prop, CTAs, screenshot
- **`SocialProof`** — User count, rating, testimonials
- **`ProblemSolution`** — Problem/solution cards
- **`BenefitsGrid`** — 6-8 benefit cards
- **`FeaturesGrid`** — Detailed feature cards
- **`ExamplesSection`** — Before/after examples
- **`UseCases`** — Audience-specific use cases
- **`RelatedTools`** — Links to related tools
- **`FAQSection`** — Expandable FAQ with schema
- **`FinalCTA`** — Strong conversion section
- **`SchemaMarkup`** — JSON-LD schemas

### 3. Page Setup

Create a page file (e.g., `src/app/(public)/tools/my-tool/page.tsx`):

```typescript
import type { Metadata } from "next";
import { myToolConfig } from "@/lib/tools-config";
import { generateToolMetadata } from "@/lib/tool-metadata";
import { ToolLandingTemplate } from "@/components/tool-landing/tool-landing-template";

export const metadata: Metadata = generateToolMetadata(myToolConfig);

export default function MyToolPage() {
  return <ToolLandingTemplate tool={myToolConfig} />;
}
```

That's it! The template auto-generates all 11 sections with proper SEO markup.

## Adding a New Tool

### Step 1: Create Tool Configuration

Add a new tool to `src/lib/tools-config.ts`:

```typescript
export const newToolConfig: ToolConfig = {
  id: "new-tool",
  slug: "new-tool-slug",
  name: "New Tool",
  title: "New Tool | Long Title for SEO",
  tagline: "One-sentence hook",
  description: "Short meta description (155-160 chars)",
  longDescription: `
    # Long-form SEO Content
    
    Write 1500-2500 words here. Use H2/H3 headings,
    natural keyword distribution, and answer user intent.
  `,
  keywords: ["keyword1", "keyword2", "keyword3"],
  primaryKeyword: "main keyword",
  secondaryKeywords: ["secondary keyword"],
  
  heroTagline: "Build/Create/Generate your [outcome]",
  heroCTA: "Use Tool",
  heroCTASecondary: "Learn More",
  thumbnailUrl: "/thumbnails/new-tool.png",
  trustBadges: ["Free", "No sign-up", "Private"],
  
  userCount: "5,000+",
  rating: 4.7,
  testimonials: [
    {
      text: "This changed my workflow.",
      author: "Jane Smith",
      role: "Product Designer",
    }
  ],
  
  problemStatement: "Users struggle with...",
  solutionStatement: "We solve this by...",
  
  benefits: [
    {
      title: "Benefit Title",
      description: "Benefit description",
      icon: "lightning",
    }
  ],
  
  features: [
    {
      title: "Feature Name",
      description: "What it does and why it matters",
    }
  ],
  
  examples: [
    {
      title: "Example 1",
      description: "How it's used",
      keywords: ["use-case"],
    }
  ],
  
  useCases: [
    {
      audience: "Audience Name",
      description: "Why they'd use it",
      examples: ["Example 1", "Example 2"],
    }
  ],
  
  faqs: [
    {
      q: "Frequently asked question?",
      a: "Answer with keyword variants.",
    }
  ],
  
  toolUrl: "/tools/new-tool/tool",
  playStoreUrl: "https://play.google.com/...",
  canonicalUrl: "/tools/new-tool",
  ogImage: "/thumbnails/new-tool.png",
};

// Add to registry
export const toolConfigs: Record<string, ToolConfig> = {
  [habitTrackerConfig.id]: habitTrackerConfig,
  [newToolConfig.id]: newToolConfig, // ← Add here
};
```

### Step 2: Create Page File

Create `src/app/(public)/tools/new-tool/page.tsx`:

```typescript
import type { Metadata } from "next";
import { newToolConfig } from "@/lib/tools-config";
import { generateToolMetadata } from "@/lib/tool-metadata";
import { ToolLandingTemplate } from "@/components/tool-landing/tool-landing-template";

export const metadata: Metadata = generateToolMetadata(newToolConfig);

export default function NewToolPage() {
  return <ToolLandingTemplate tool={newToolConfig} />;
}
```

### Step 3: Create Tool Page

Create `src/app/(public)/tools/new-tool/tool/page.tsx` for the actual interactive tool.

### Step 4: Add Thumbnail & OG Image

- Thumbnail: `/public/thumbnails/new-tool.png` (16:9 ratio, ~1000x560px)
- OG Image: `/public/thumbnails/new-tool.png` (same, or custom 1200x630px)

## Content Guidelines

### Hero Section

- **H1 (title)**: Include primary keyword, 55-65 characters
- **Tagline**: Short value prop, action-oriented
- **Description**: Meta description, 155-160 characters
- **CTAs**: Primary (tool), secondary (learn more or install), optional (Play Store)

### Problem + Solution

- **Problem**: What users struggle with, why existing solutions don't work
- **Solution**: How your tool solves it specifically

### Benefits (6-8 cards)

Focus on outcomes, not features:
- ✓ "Save 30 minutes daily" (not "Fast processing")
- ✓ "No learning curve" (not "Intuitive UI")
- ✓ "Works offline" (not "Local computation")

### Features

Detailed descriptions of capabilities with use-case context.

### Examples (2-4)

Before/after pairs showing:
- Title: The use case
- Before: Without the tool
- After: With the tool
- Description: Why it matters
- Keywords: SEO-relevant terms

### Use Cases (4-6 audiences)

Each with:
- **Audience name** (Designers, Students, Parents, etc.)
- **Description** of why they use it
- **Examples** of specific use cases

### FAQs (20-30 questions)

Answer common questions while:
- Using natural keyword variants
- Addressing objections and concerns
- Providing implementation tips
- Building trust

### Long-Form Content

The `longDescription` field should:
- Use semantic HTML headings (H2, H3)
- Include natural keyword distribution (2-3% keyword density)
- Provide comprehensive, original information
- Address search intent (informational, navigational, transactional)
- Link to related resources
- Break up text with subheadings and lists
- Target 1500-2500 words

## Customization

### Adding Custom Sections

Pass additional content to `ToolLandingTemplate`:

```typescript
export default function CustomToolPage() {
  return (
    <ToolLandingTemplate tool={newToolConfig}>
      {/* Custom section */}
      <section>
        <h2>Custom Content</h2>
        <p>Add anything here</p>
      </section>
    </ToolLandingTemplate>
  );
}
```

### Styling

All components use CSS variables from `redef-theme.css`:

```
--ink: main text
--body: body text
--body-muted: secondary text
--paper: subtle background
--line: borders
--rf-green: accent color (primary brand)
--rf-violet, --rf-amber, etc: secondary colors
```

Override by wrapping in a `<style>` tag or creating `.module.css` files.

### Icons

The `BenefitsGrid` uses icon names mapped to Lucide icons. Add more icons in `benefits-grid.tsx`:

```typescript
const iconMap: Record<string, React.ReactNode> = {
  lightning: <Zap size={20} />,
  customize: <Settings size={20} />,
  // Add more...
};
```

## SEO Best Practices

### Metadata

All handled by `generateToolMetadata()`:
- ✓ Title tag (55-65 chars)
- ✓ Meta description (155-160 chars)
- ✓ Canonical URL
- ✓ Open Graph (Facebook, LinkedIn)
- ✓ Twitter Card
- ✓ Keywords array

### Schema Markup

Auto-generated JSON-LD includes:
- **BreadcrumbList** — Navigation structure
- **SoftwareApplication** — Tool information, ratings
- **FAQPage** — FAQ schema for rich results
- **WebPage** — Article/page metadata

### Content Structure

- H1 per page (in hero)
- H2 for major sections
- H3 for subsections
- Semantic HTML (article, section, header)
- Alt text for images

### Performance

- Images use `next/image` for lazy loading
- `AspectRatio` component prevents layout shift
- `quality` attribute optimizes file size
- `sizes` prop ensures responsive images

### Accessibility

- Semantic HTML structure
- `aria-hidden` on decorative elements
- Color contrast meets WCAG AA
- Keyboard navigation on interactive elements

## Maintenance

### Updating Content

Edit the tool config in `tools-config.ts`. Changes reflect automatically.

### Adding Related Tools

In tool config, add `relatedToolIds`:

```typescript
relatedToolIds: ["habit-tracker", "another-tool-id"],
```

Or leave empty to show all other tools.

### Monitoring SEO

Track metrics:
- **Google Search Console** — Impressions, CTR, rankings
- **Page Speed Insights** — Core Web Vitals
- **Google Analytics** — Traffic, bounce rate, conversions
- **Rank tracking** — Keyword positions over time

## Example: Habit Tracker Tool

See `habitTrackerConfig` in `tools-config.ts` for a complete, production-ready example.

## File Structure

```
src/
├── lib/
│   ├── tools-config.ts           # Tool configs (data layer)
│   └── tool-metadata.ts          # SEO metadata generators
├── components/tool-landing/
│   ├── hero-section.tsx
│   ├── social-proof.tsx
│   ├── problem-solution.tsx
│   ├── benefits-grid.tsx
│   ├── features-grid.tsx
│   ├── examples-section.tsx
│   ├── use-cases.tsx
│   ├── related-tools.tsx
│   ├── faq-section.tsx
│   ├── final-cta.tsx
│   ├── schema-markup.tsx
│   └── tool-landing-template.tsx  # Main template
└── app/(public)/tools/
    ├── page.tsx                   # Tools hub
    └── [tool-slug]/
        ├── page.tsx               # Landing page (uses template)
        └── tool/
            └── page.tsx           # Interactive tool
```

## Tips

1. **Write for humans first, SEO second** — Content should read naturally
2. **Use primary keyword in H1, H2, and first 100 words** — Signal relevance to search engines
3. **Answer the "why"** — Help users understand the problem and solution
4. **Test everything** — Use Google's Rich Results Test for schema validation
5. **Monitor performance** — Track rankings and traffic after launch
6. **Update regularly** — Fresh content signals active maintenance to search engines
7. **Internal linking** — Link to related tools to build topical authority
8. **Mobile first** — All components are mobile-responsive by default

## Checklist for New Tool

- [ ] Define complete `ToolConfig` with all required fields
- [ ] Write SEO-focused long-form content (1500-2500 words)
- [ ] Add 20-30 FAQs covering common questions
- [ ] Create 2-4 real examples showing before/after
- [ ] Define 4-6 use cases for different audiences
- [ ] Add 6-8 benefit cards highlighting outcomes
- [ ] List 7-10 detailed features
- [ ] Add hero screenshot/thumbnail (16:9, PNG)
- [ ] Create OG image for social sharing (1200x630 or same as thumbnail)
- [ ] Register tool in `toolConfigs` registry
- [ ] Create page file with metadata generator
- [ ] Create interactive tool page
- [ ] Test on mobile and desktop
- [ ] Validate schema markup with Rich Results Test
- [ ] Submit to Google Search Console
- [ ] Monitor rankings and traffic weekly

## Questions?

Refer to the components (`src/components/tool-landing/`) for implementation details. Each component includes inline documentation.
