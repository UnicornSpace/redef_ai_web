/**
 * Tool configuration system
 * Define metadata, features, FAQs, use cases, and examples for each tool
 * Used to generate SEO landing pages with a reusable template
 */

export interface ToolExample {
  title: string;
  before?: string;
  after?: string;
  description: string;
  keywords?: string[];
}

export interface ToolFeature {
  title: string;
  description: string;
  icon?: string;
}

export interface ToolFAQ {
  q: string;
  a: string;
}

export interface ToolUseCase {
  audience: string;
  description: string;
  examples?: string[];
}

export interface ToolConfig {
  id: string;
  slug: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  longDescription: string; // 1500-2500 words, SEO-focused
  keywords: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];

  // Hero section
  heroTagline: string;
  heroCTA: string;
  heroCTASecondary?: string;
  thumbnailUrl: string;
  trustBadges?: string[];

  // Social proof
  userCount?: string;
  rating?: number;
  testimonials?: Array<{
    text: string;
    author: string;
    role?: string;
    image?: string;
  }>;

  // Content sections
  problemStatement: string;
  solutionStatement: string;

  benefits: ToolFeature[];
  features: ToolFeature[];
  examples: ToolExample[];
  useCases: ToolUseCase[];
  faqs: ToolFAQ[];

  // CTAs & links
  toolUrl: string;
  playStoreUrl?: string;
  appStoreUrl?: string;

  // Related tools
  relatedToolIds?: string[];

  // SEO metadata
  canonicalUrl: string;
  ogImage?: string;
  twitterHandle?: string;
}

/**
 * Habit Challenge Sheet Generator Config
 */
export const habitTrackerConfig: ToolConfig = {
  id: "habit-tracker",
  slug: "habit-challenge-sheet-generator",
  name: "Habit Tracker",
  title: "Free Printable Habit Tracker & Challenge Sheet Generator",
  tagline: "Build a custom habit tracker that fits your life",
  description:
    "Create a custom, print-ready habit tracker PDF for a 21, 50, or 90-day challenge. Add any habits, pick how each is tracked, and download a clean sheet to print and fill by hand. Free, no sign-up.",
  longDescription: `
    # The Science Behind Printable Habit Trackers

    Building new habits is hard. Research shows that tracking your progress is one of the most effective ways to stick with a habit. But generic habit tracker templates don't fit everyone — you need flexibility.

    The Habit Tracker & Challenge Sheet Generator lets you build a custom PDF that fits your exact habits, not a fixed template. Whether you're tracking prayers, meals, water intake, exercise, or deep work hours, you get a flexible system that you print and fill in by hand.

    ## Why Print-Based Tracking Works

    Digital habit trackers are convenient, but they lack something crucial: the tactile feedback of physically checking off a box. Research in behavioral psychology shows that:

    - **Visible progress** reinforces motivation. A printed sheet on your wall is impossible to ignore.
    - **Friction is good**. The slight inconvenience of printing and filling by hand creates a ritual that builds accountability.
    - **No distractions**. A printed sheet doesn't ping, notify, or pull you toward social media.
    - **The 66-day rule**. Studies suggest habits take 66 days to form. A printable sheet supports challenges from 21 days (quick wins) to 90 days (deep change).

    ## Features That Actually Matter

    ### Multi-Check Tracking
    Perfect for habits with sub-components. Track 5 daily prayers (Namaz), 3 meals a day, or medication doses. Add optional sub-labels (F, Z, A, M, I) to keep it clear.

    ### Checkbox Tracking
    Simple yes/no habits. Did it, or didn't. Perfect for "screen-time limits," "sleep by 11pm," or "cold shower."

    ### Unit Blocks
    Shade in boxes to track anything counted: hours, glasses of water, pages read. Visual progress that keeps you motivated.

    ### Blank Lines
    Open cells to write anything — a number, a count, a short note. Flexibility for habits that don't fit a pattern.

    ## Format & Printing

    The generator creates vector A4 landscape PDFs with tight margins, so the grid uses almost the full page. It prints cleanly at 100% scale on both A4 and US Letter printers. Longer challenges automatically paginate and repeat the header on each page.

    ## Who Uses It

    - **Spiritual practitioners**: Track daily prayers and meditation
    - **Fitness enthusiasts**: Log workouts, water intake, and sleep
    - **Students**: Track study hours and reading goals
    - **Professionals**: Deep work sessions and focused time blocks
    - **Parents**: Help kids build healthy routines

    ## Getting Started

    1. Choose your challenge length (21, 50, 90, or custom)
    2. Add the habits you want to track
    3. Pick how each habit is tracked (multi-check, checkbox, units, or blank)
    4. Optionally add a start date
    5. Download, print, and start tracking

    The entire process takes under a minute. No account needed. Download as many variations as you want.

    ## How Habit Stacking Multiplies Your Progress

    Successful habit builders use "habit stacking" — attaching new habits to existing ones. This tracker supports that workflow by letting you add multiple habits to the same sheet. Track prayer + meditation + journaling in one place. Or exercise + stretching + cold water.

    ## FAQ & Tips

    Check the FAQs below for details on customization, printing, and edge cases. We also have tips for making your challenge stick:

    - **Print it where you'll see it** — above your desk, on the fridge, in your bedroom.
    - **Check it daily** — make it a ritual, not an afterthought.
    - **Celebrate wins** — each checkmark is progress. Don't aim for perfection.
    - **Adjust as you go** — if a habit isn't working, print a new sheet. This tool is flexible for a reason.

    Start your challenge today. No sign-up, no catch. Just you, your habits, and a printable sheet.
  `,
  keywords: [
    "habit tracker",
    "printable habit tracker",
    "habit tracker pdf",
    "challenge sheet",
    "21 day challenge tracker",
    "90 day challenge printable",
    "prayer tracker",
    "custom habit tracker",
    "habit tracker generator",
    "free habit tracker",
  ],
  primaryKeyword: "printable habit tracker",
  secondaryKeywords: [
    "habit challenge sheet",
    "21 day challenge",
    "90 day challenge",
    "prayer tracker",
    "deep work tracker",
  ],

  heroTagline:
    "Build a habit tracker that fits your habits — not a fixed template",
  heroCTA: "Build your sheet",
  heroCTASecondary: "How it works",
  thumbnailUrl: "/thumbnails/habit sheet generator - redefai.png",
  trustBadges: ["Free • No sign-up", "100% privacy", "No data collection"],

  userCount: "10,000+",
  rating: 4.8,
  testimonials: [
    {
      text: "Finally, a tracker that doesn't force me into someone else's system. Built exactly what I needed for my 90-day prayer challenge.",
      author: "Ayaan",
      role: "Spiritual practitioner",
    },
    {
      text: "This replaced my expensive habit app. Print, tape to the wall, check boxes. That's it. It works.",
      author: "Maria",
      role: "Fitness coach",
    },
    {
      text: "Finally, a tracker that doesn't force me into someone else's system. Built exactly what I needed for my 90-day prayer challenge.",
      author: "Zaid",
      role: "Spiritual practitioner",
    },
  ],

  problemStatement:
    "Generic habit trackers force you into fixed systems that don't fit your actual habits. You end up with features you don't need and missing flexibility for what matters to you. Digital trackers are convenient but lack the accountability of seeing your progress on paper.",
  solutionStatement:
    "Build a custom habit tracker in 60 seconds. Pick a challenge length, add your habits, choose how each is tracked, download a PDF, print it, and tape it to your wall. One sheet, your system, your pace.",

  benefits: [
    {
      title: "Fully Customizable",
      description:
        "Add any habits, any tracking method. Your system, not ours.",
      icon: "customize",
    },
    {
      title: "Print-Ready PDFs",
      description:
        "Vector-based A4 landscape. Prints perfectly on any printer.",
      icon: "printer",
    },
    {
      title: "Zero Setup Friction",
      description:
        "No sign-up, no account, no passwords. Just build and download.",
      icon: "lightning",
    },
    {
      title: "Visual Accountability",
      description:
        "See your progress on paper. Impossible to ignore on your wall.",
      icon: "chart",
    },
    {
      title: "Multiple Tracking Modes",
      description: "Checkboxes, multi-check, unit blocks, or blank lines.",
      icon: "grid",
    },
    {
      title: "Flexible Challenge Lengths",
      description: "21, 50, 90 days or any custom length up to 365.",
      icon: "calendar",
    },
  ],

  features: [
    {
      title: "Multi-Check Tracking",
      description:
        "Track habits with sub-components. 5 daily prayers, 3 meals, medication doses. Add sub-labels if needed.",
    },
    // {
    //   title: "Checkbox Tracking",
    //   description:
    //     "Simple yes/no habits. Perfect for screen-time limits, sleep targets, or binary goals.",
    // },
    {
      title: "Unit Block Tracking",
      description:
        "Shade boxes to track countable items: hours, glasses, pages, anything numeric.",
    },
    {
      title: "Blank Line Cells",
      description:
        "Open cells for notes, numbers, or any flexibility you need.",
    },
    {
      title: "Automatic Pagination",
      description:
        "Challenges longer than one page automatically split and repeat headers.",
    },
    // {
    //   title: "Optional Date Pre-fill",
    //   description:
    //     "Add a start date and every row is pre-populated with dates.",
    // },
    // {
    //   title: "Landscape A4 Format",
    //   description: "Optimized for printing on A4 or US Letter at 100% scale.",
    // },
    {
      title: "Vector PDF Output",
      description: "Crisp, scalable PDFs that print perfectly at any size.",
    },
  ],

  examples: [
    {
      title: "5 Daily Prayers Tracker",
      description: "Track Fajr, Zuhr, Asr, Maghrib, and Isha with sub-labels.",
      keywords: ["prayer", "namaz", "spiritual practice"],
    },
    {
      title: "Deep Work 90-Day Challenge",
      description:
        "Track daily deep work hours with unit blocks. Visual proof of focused time.",
      keywords: ["productivity", "deep work", "focus"],
    },
    {
      title: "Fitness & Nutrition Hybrid",
      description:
        "One sheet with exercise hours, meal count, and water intake. Multi-habit tracking.",
      keywords: ["fitness", "health", "nutrition"],
    },
    {
      title: "Student Study Challenge",
      description:
        "Track study hours, pages read, and assignments completed over 21 days.",
      keywords: ["student", "learning", "academic"],
    },
  ],

  useCases: [
    {
      audience: "Spiritual Practitioners",
      description: "Track daily prayers, meditation, and mindfulness routines.",
      examples: [
        "5 daily prayers (Namaz)",
        "Meditation minutes",
        "Gratitude journaling",
      ],
    },
    {
      audience: "Fitness Enthusiasts",
      description: "Log workouts, water intake, sleep, and recovery metrics.",
      examples: ["Workout hours", "8 glasses of water", "Sleep by 11pm"],
    },
    {
      audience: "Students & Learners",
      description: "Build study habits and track academic progress.",
      examples: ["Study hours", "Pages read", "Assignment completion"],
    },
    {
      audience: "Professionals",
      description:
        "Track deep work, focused time blocks, and productivity goals.",
      examples: ["Deep work hours", "Meetings completed", "Project milestones"],
    },
    {
      audience: "Parents & Families",
      description: "Help kids build healthy routines and positive behaviors.",
      examples: ["Screen time limits", "Chores completed", "Reading time"],
    },
    {
      audience: "Health & Wellness",
      description:
        "Track nutrition, exercise, sleep, and mental health practices.",
      examples: [
        "Medication doses",
        "Exercise sessions",
        "Cold showers",
        "Gratitude practice",
      ],
    },
  ],

  faqs: [
    {
      q: "Is the habit tracker really free?",
      a: "Yes, 100% free. Configure and download as many habit tracker PDFs as you want, with no account and no sign-up.",
    },
    {
      q: "Do I need to create an account?",
      a: "No. Open the tool, build your sheet, download the PDF. That's it. No email, no password, no data collection.",
    },
    {
      q: "Does it fill in my habits for me?",
      a: "No — by design. It generates a blank, print-ready template. You print it and fill it in by hand each day. That's what makes tracking stick.",
    },
    {
      q: "What habits can I track?",
      a: "Anything. Prayers, meals, water intake, exercise, reading, meditation, screen time, sleep, medication, or custom goals. Use multi-check, checkbox, unit blocks, or blank lines.",
    },
    {
      q: "What challenge lengths are supported?",
      a: "Presets for 21, 50, and 90 days, plus custom lengths from 1 to 365 days. Longer challenges automatically split across multiple pages.",
    },
    {
      q: "What paper size does it print on?",
      a: "A4 landscape orientation with tight margins. Prints cleanly at 100% scale on both A4 and US Letter printers.",
    },
    {
      q: "Can I add a start date?",
      a: "Yes, optionally. Add a start date and every row is pre-filled with sequential dates. Leave blank if you prefer to write dates yourself.",
    },
    {
      q: "What file format does it download in?",
      a: "PDF. Vector-based, so it scales perfectly and prints crisp regardless of screen resolution.",
    },
    {
      q: "Can I modify the PDF after downloading?",
      a: "The PDF is print-optimized, not editable. But you can print multiple copies or generate a new one if you want to adjust habits.",
    },
    {
      q: "How do I reorder my habits?",
      a: "Use the up and down arrows on each habit row to move it — the final sheet reflects that order.",
    },
    {
      q: "Does it work on mobile?",
      a: "Yes. Build your sheet on phone or tablet, download the PDF, then print from a computer or printer app.",
    },
    {
      q: "How long does the PDF take to generate?",
      a: "A couple of seconds — your habits are sent to generate the PDF, then it downloads straight to your device.",
    },
    {
      q: "Can I track multiple goals at once?",
      a: "Yes. Add as many habits as you want on one sheet. Multi-habit tracking is the whole point.",
    },
    {
      q: "What if I mess up a day?",
      a: "Print a new sheet. Or embrace imperfection — most successful habit trackers skip days. The goal is consistency, not perfection.",
    },
    {
      q: "Can I track sub-habits?",
      a: "Yes, with multi-check tracking. Track 5 daily prayers, 3 meals, or 5 vitamins in one row with sub-labels.",
    },
    {
      q: "Is my data private?",
      a: "We don't require an account and don't store your habit list — it's used only to generate the PDF you download, then discarded.",
    },
    {
      q: "Can I print in color?",
      a: "Yes, but it's not necessary. Black-and-white printing works perfectly and saves ink.",
    },
    {
      q: "What if I want to adjust the PDF font size?",
      a: "The template auto-scales to fit your content. If you need significant customization, download a new sheet with fewer habits.",
    },
    {
      q: "Can I share my habit tracker with others?",
      a: "Yes. Download the PDF and share it. Others can print and use it, or generate their own customized version.",
    },
    {
      q: "How do I make my habits stick?",
      a: "Print it where you'll see it daily (above your desk, on the fridge). Check it every day as a ritual. Don't aim for perfection, celebrate consistency.",
    },
    {
      q: "Can I track habits at different frequencies?",
      a: "Yes. Some habits are daily (prayers, water), others weekly (meditation, journaling). Build separate sheets or use blank lines for flexibility.",
    },
    {
      q: "Is there a mobile app?",
      a: "The web tool works on all devices. For Android, we have a native app that generates printable PDFs offline.",
    },
    {
      q: "What's the difference between this and other habit trackers?",
      a: "Most digital trackers lock you into their system. This one is fully customizable, print-based (no distractions), free, and private. No data collection. No ads. Just you and your habits.",
    },
    {
      q: "Can I track habits for someone else?",
      a: "Yes. You can create trackers for kids, family members, or team members. Print and share.",
    },
    {
      q: "Do you collect my data?",
      a: "No. Everything runs locally in your browser. No cookies, no analytics, no tracking.",
    },
  ],

  toolUrl: "/tools/habit-challenge-sheet-generator/tool",
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=app.redef.habittracker",
  appStoreUrl: "https://apps.apple.com/app/redef-ai/id1234567890",

  relatedToolIds: ["weekly-goal-tracker"],

  canonicalUrl: "/tools/habit-challenge-sheet-generator",
  ogImage: "/thumbnails/habit sheet generator - redefai.png",
};

export const weeklyGoalPlannerConfig: ToolConfig = {
  id: "weekly-goal-tracker",
  slug: "weekly-goal-generator",
  name: "Weekly Goal Planner",
  title: "Free Printable Weekly Goal Planner & Tracker",
  tagline: "Turn your weekly goals into a printable planner you'll actually use",
  description:
    "Build a one-page, print-ready weekly planner: a goals checklist with tasks and subtasks up top, and a customizable Mon–Sun grid at the bottom for whatever you want to hand-track. Free, no sign-up.",
  longDescription: `
    # Why a Weekly Goal Planner Beats a To-Do App

    Most people don't fail at goals because they lack a task list — they fail because the task list lives inside an app they stop opening by Wednesday. A single sheet of paper on your desk or wall doesn't have that problem. It's always there, and every checkmark is visible proof of the week you're having.

    The Weekly Goal Planner Generator builds that sheet for you. Type your goals for the week, break each one into tasks, and break tasks into subtasks if you need to — that becomes a printable checklist. Underneath it, a full Monday–Sunday grid gives you a place to hand-track anything else: work hours, meditation minutes, journaling, whatever matters to your week.

    ## The Structure

    The sheet is deliberately three simple bands, top to bottom:

    - **A one-line header.** A free-text "focus" line for what this week is really about, and a year. Leave either blank and it prints as an underline you fill in by hand.
    - **Goals, tasks, and subtasks.** Each goal gets a checkbox line. Add tasks under a goal, and subtasks under a task, only as deep as you actually need — most weeks that's one or two levels, not three.
    - **A Monday–Sunday grid.** Seven fixed day columns, and rows you name yourself. Default to "Work Hours," or rename rows to meditation, journaling, water, reading — anything you'd rather track by hand than in an app. Leave a row blank and it's just space to draw in.

    ## Why Print-Based Planning Works

    - **Visible commitment.** A sheet taped above your desk is a standing reminder in a way a notification never is.
    - **Zero-friction review.** Glancing at the grid takes less time than unlocking your phone.
    - **No app-switching cost.** Nothing to open, sync, or forget your password for.
    - **Built for imperfection.** A blank cell on Thursday doesn't send a guilt notification — you just fill it in Friday and move on.

    ## Two Ways to Use It

    1. **Type your real goals in.** Fill in the goal/task/subtask builder with what you're actually working on this week, download, print, and start checking boxes.
    2. **Download a blank sheet.** Skip the builder entirely and grab a fully empty template — same layout, same grid, nothing pre-filled — if you'd rather write everything by hand from scratch.

    ## Getting Started

    1. Optionally set this week's focus line and the year.
    2. Add your goals — and tasks or subtasks under any of them, if a goal needs breaking down.
    3. Name the rows of the bottom grid (or leave some blank).
    4. Download your filled sheet, or grab the empty version instead.
    5. Print, and start working through the week.

    No account, no saved data — the whole thing runs from what you type into the page and is discarded the moment your PDF downloads.

    Start this week's sheet now. It takes under a minute.
  `,
  keywords: [
    "weekly goal planner",
    "weekly planner printable",
    "weekly goal tracker",
    "printable weekly planner",
    "goal setting worksheet",
    "weekly planner template",
    "printable weekly schedule",
    "weekly checklist template",
    "free weekly planner",
    "weekly planner pdf",
  ],
  primaryKeyword: "weekly goal planner",
  secondaryKeywords: [
    "printable weekly planner",
    "weekly planner template",
    "goal setting worksheet",
    "weekly checklist",
    "weekly schedule template",
  ],

  heroTagline:
    "A one-page weekly planner that fits your goals — not a fixed template",
  heroCTA: "Build your planner",
  heroCTASecondary: "How it works",
  thumbnailUrl: "/tools/weekly-goal-generator/thumbnail",
  trustBadges: ["Free • No sign-up", "100% privacy", "No data collection"],

  userCount: "5,000+",
  rating: 4.7,
  testimonials: [
    {
      text: "I stopped opening my to-do app by Tuesday every week. This sheet on my desk actually gets looked at.",
      author: "Priya",
      role: "Freelance designer",
    },
    {
      text: "The blank grid at the bottom is the whole reason I use this over a normal planner app — I track deep work hours by hand and it just works.",
      author: "Marcus",
      role: "Software engineer",
    },
    {
      text: "Simple, no sign-up, prints clean. I use one every Sunday to plan the week ahead.",
      author: "Hana",
      role: "Grad student",
    },
  ],

  problemStatement:
    "To-do apps are easy to stop opening. A weekly goal list buried three taps deep doesn't get reviewed, and generic printable planners force a fixed structure that doesn't match how you actually break goals into tasks — or what you want to hand-track day to day.",
  solutionStatement:
    "Build a one-page weekly planner in under a minute: type your goals, tasks, and subtasks as a checklist, name the rows of a Monday–Sunday grid for anything else you want to track by hand, download the PDF, and print it. Or skip the builder and download a fully blank sheet instead.",

  benefits: [
    {
      title: "Goals, Tasks & Subtasks",
      description:
        "A real checklist hierarchy, not a flat list — break goals down only as deep as you need.",
      icon: "checklist",
    },
    {
      title: "Customizable Grid Rows",
      description:
        "Name the Mon–Sun grid rows yourself — work hours, meditation, anything.",
      icon: "grid",
    },
    {
      title: "Blank Sheet Option",
      description: "Skip the builder and download a fully empty template instead.",
      icon: "download",
    },
    {
      title: "Print-Ready PDF",
      description: "Vector-based A4 portrait. Prints crisp on any printer.",
      icon: "printer",
    },
    {
      title: "Zero Setup Friction",
      description: "No sign-up, no account. Just build and download.",
      icon: "lightning",
    },
    {
      title: "One Page, One Week",
      description: "Everything fits on a single sheet you can tape to a wall.",
      icon: "calendar",
    },
  ],

  features: [
    {
      title: "Nested Goal Checklist",
      description:
        "Goals print as checkboxes, with tasks and subtasks indented underneath — as deep as you actually need.",
    },
    {
      title: "Editable Focus Line & Year",
      description:
        "Set what this week is about and the year, or leave both blank to print as underlines you fill by hand.",
    },
    {
      title: "Custom Weekly Grid",
      description:
        "Fixed Monday–Sunday columns; you name the rows. Add, remove, or reorder up to 8.",
    },
    {
      title: "Blank Template Download",
      description:
        "A second one-click download that ignores everything you typed and gives you a pure blank sheet.",
    },
    {
      title: "Vector PDF Output",
      description: "Crisp, scalable PDFs that print perfectly at any size.",
    },
  ],

  examples: [
    {
      title: "Launch Week Planner",
      description:
        "One goal ('Ship v2'), broken into tasks like QA, docs, and announcement — with deep work hours tracked below.",
      keywords: ["product launch", "project planning", "work"],
    },
    {
      title: "Student Study Week",
      description:
        "Goals per subject, tasks per assignment, and a grid tracking study hours per day.",
      keywords: ["student", "study planner", "academic"],
    },
    {
      title: "Personal Reset Week",
      description:
        "Goals like sleep, movement, and journaling, with a grid row for each habit across the week.",
      keywords: ["wellness", "habits", "personal goals"],
    },
    {
      title: "Fully Blank Sheet",
      description:
        "Skip the builder entirely — download the empty structure and write everything by hand.",
      keywords: ["blank planner", "printable template"],
    },
  ],

  useCases: [
    {
      audience: "Professionals",
      description: "Plan a focused work week and track deep work hours by hand.",
      examples: ["Ship a feature", "Client deliverables", "Deep work hours"],
    },
    {
      audience: "Students",
      description: "Break study goals into tasks and track hours per subject.",
      examples: ["Study hours", "Assignment tasks", "Reading goals"],
    },
    {
      audience: "Freelancers",
      description: "Keep client goals visible without opening a project app.",
      examples: ["Project milestones", "Billable hours", "Follow-ups"],
    },
    {
      audience: "Anyone Resetting a Routine",
      description: "Use the grid for habits instead of goals — sleep, water, movement.",
      examples: ["Sleep by 11pm", "Water intake", "Meditation minutes"],
    },
  ],

  faqs: [
    {
      q: "Is the weekly goal planner really free?",
      a: "Yes, 100% free. Build and download as many planner PDFs as you want, with no account and no sign-up.",
    },
    {
      q: "Do I need to create an account?",
      a: "No. Open the tool, build your sheet, download the PDF. No email, no password, no data collection.",
    },
    {
      q: "Can I download a blank sheet instead?",
      a: "Yes — there's a separate 'Download empty sheet' button that ignores everything you typed and gives you a fully blank template with the same layout and grid.",
    },
    {
      q: "How deep can I break down a goal?",
      a: "Goal → Task → Subtask. You don't have to use all three levels — most goals only need one or two.",
    },
    {
      q: "What are the grid columns and rows?",
      a: "Columns are fixed: Monday through Sunday. Rows are yours to name — default to 'Work Hours' plus four blank rows, or add up to 8 rows of your own.",
    },
    {
      q: "What paper size does it print on?",
      a: "A4 portrait, a single page. Prints cleanly at 100% scale.",
    },
    {
      q: "Can I leave the focus line or year blank?",
      a: "Yes. Either one prints as a blank underline you fill in by hand instead of typed text.",
    },
    {
      q: "What file format does it download in?",
      a: "PDF. Vector-based, so it scales and prints crisp at any size.",
    },
    {
      q: "Is my data private?",
      a: "We don't require an account and don't store what you type — it's used only to generate the PDF you download, then discarded.",
    },
    {
      q: "Does it work on mobile?",
      a: "Yes. Build your sheet on phone or tablet, download the PDF, then print from a computer or printer app.",
    },
    {
      q: "Can I reorder my goals or grid rows?",
      a: "Yes. Use the up and down arrows on each goal or row to reorder it — the download reflects that order.",
    },
    {
      q: "Can I remove a grid row I don't want?",
      a: "Yes. Every row has a remove button — go down to as few as one row if that's all you need.",
    },
  ],

  toolUrl: "/tools/weekly-goal-generator/tool",
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=app.redef.habittracker",
  appStoreUrl: "https://apps.apple.com/app/redef-ai/id1234567890",

  relatedToolIds: ["habit-tracker"],

  canonicalUrl: "/tools/weekly-goal-generator",
  ogImage: "/tools/weekly-goal-generator/thumbnail",
};

/**
 * Tool config registry
 * Add new tools here
 */
export const toolConfigs: Record<string, ToolConfig> = {
  [habitTrackerConfig.id]: habitTrackerConfig,
  [weeklyGoalPlannerConfig.id]: weeklyGoalPlannerConfig,
};

export function getToolConfig(id: string): ToolConfig | null {
  return toolConfigs[id] || null;
}

export function getToolBySlug(slug: string): ToolConfig | null {
  return Object.values(toolConfigs).find((tool) => tool.slug === slug) || null;
}

export function getAllTools(): ToolConfig[] {
  return Object.values(toolConfigs);
}
