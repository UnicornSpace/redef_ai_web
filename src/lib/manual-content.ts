/**
 * Content for the internal manual at /app/manual. Kept as data rather than
 * JSX so it stays readable as a plain reference — and so it's obvious when
 * a section has drifted from the code it describes.
 *
 * WHEN YOU ADD A CAPABILITY, ADD IT HERE. The whole point of this file is
 * that the app's surface area is knowable without reading every route.
 */

export const MANUAL_UPDATED = "August 2026";

export interface ManualEntry {
  name: string;
  /** In-app route, if this thing has a page. Rendered as a live link. */
  route?: string;
  /** Short badge — e.g. "Optional module", "Always on". */
  tag?: string;
  description: string;
  details?: string[];
  /** Real phrasings that trigger this in Talk. */
  examples?: string[];
}

export interface ManualSection {
  id: string;
  title: string;
  intro?: string;
  entries: ManualEntry[];
}

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "what-it-is",
    title: "What Redef is",
    intro:
      "A voice-first productivity system. The core idea: you talk, it handles the bookkeeping. Everything below is reachable by speaking to Talk as well as through its own screen.",
    entries: [
      {
        name: "The shape of the product",
        description:
          "Four optional modules (Habits, Tasks, Deep Work, Personal Finance) plus a set of always-on surfaces (Talk, Calendar, Challenges, Home, Reports). Users pick their modules during onboarding, and everything — sidebar, AI tools, reports, the day wrap-up — respects that choice.",
        details: [
          "Turning a module off doesn't just hide its page: the assistant loses those tools entirely and is told not to offer the capability.",
          "Modules are stored on profiles.enabled_modules and changed in Settings → Preferences.",
        ],
      },
      {
        name: "Two ways to talk to it",
        route: "/app/talk",
        description:
          "Text chat and a live voice call share one brain — the same system prompt, the same tools, the same memory. The only difference is delivery: in text, tool results render as widgets and the assistant writes a one-line caption; on a call there's no widget, so it speaks the actual numbers.",
        details: [
          "Phone button = live voice call (OpenAI Realtime API). Continuous audio, interruptible mid-sentence.",
          "Mic button = record → transcribe → send as text. Separate flow, works without a Realtime-enabled key.",
          "Speaker button = read replies aloud in text mode.",
        ],
      },
    ],
  },

  {
    id: "wind-up",
    title: "Winding up the day",
    intro:
      "The end-of-day ritual. Ask to close out and the assistant pulls everything already logged, then asks only about what's missing — it should never ask for a number the app already has.",
    entries: [
      {
        name: "How the flow runs",
        description:
          "It calls getDayReview first (deep-work hours, habit status with per-item checklist detail, tasks done vs open, money spent), opens with what it knows, then works through the gaps one at a time — logging each answer as you give it rather than collecting them all and dumping at the end.",
        examples: [
          "Wind up my day",
          "Let's close out today",
          "I forgot to wrap up yesterday — do it for the 14th",
        ],
      },
      {
        name: "It works for past days",
        description:
          "Every logging tool takes an explicit date and accepts past dates, so a wrap-up you skipped is still recoverable. Future dates are rejected.",
        examples: [
          "I did my run yesterday, mark it",
          "Log 3 hours of deep work for Monday",
          "Tick stretching on my morning routine for the 12th",
        ],
      },
    ],
  },

  {
    id: "habits",
    title: "Habits",
    intro: "Four habit types, streaks, priorities, and shared habits.",
    entries: [
      {
        name: "Habit types",
        route: "/app/habits",
        tag: "Optional module",
        description:
          "Each habit is one of four types, and the type decides how it's completed.",
        details: [
          "Yes/no — a single checkbox. Done or not.",
          "Checklist — sub-items. Ticking every non-optional item auto-completes the parent for that day.",
          "Number — a goal with a comparator (at least / less than / exactly) and a unit. Logging a value decides completion automatically.",
          "Smart checklist — parent/child habits. Currently hidden in the UI.",
        ],
        examples: [
          "How are my habits tracking?",
          "Mark meditation done",
          "I did 30 pushups",
          "Tick the stretching item on my morning routine",
        ],
      },
      {
        name: "Focus vs Cards layout",
        route: "/app/habits",
        description:
          "Focus is a rip-through checklist — desktop shows a weekly matrix alongside, mobile shows a scrollable 30-day date strip where each day is a 'filling can' you can tap to review or backfill that date. Cards is the masonry grid with per-habit detail.",
        details: [
          "Priority (high/medium/low) sorts the Focus list; unset sorts last.",
          "Streak flames show the current run.",
          "Finishing every habit for today fires confetti and a sound.",
        ],
      },
      {
        name: "Shared habits",
        description:
          "Habits can be shared by invite link. A collaborator's progress lives on their own row, so both people keep independent streaks on the same habit.",
      },
    ],
  },

  {
    id: "other-modules",
    title: "Tasks, Deep Work & Finance",
    entries: [
      {
        name: "Tasks",
        route: "/app/tasks",
        tag: "Optional module",
        description:
          "A to-do list with categories and due dates. The home dashboard surfaces a compact widget of what's open.",
        examples: [
          "What's on my list?",
          "Remind me to email the accountant",
          "Mark the report task done",
        ],
      },
      {
        name: "Deep Work",
        route: "/app/deep-work",
        tag: "Optional module",
        description:
          "Focus sessions, either timed live or logged after the fact against a project. Natural-language logging splits a sentence into separate sessions rather than one merged block.",
        details: [
          "\"9 to 12 on the redesign, then 1 to 5 on the API\" logs as TWO sessions against two projects, not one.",
          "The assistant looks up your real projects first and never invents a project id.",
        ],
        examples: [
          "I worked 9 to 12 on the redesign",
          "How much did I work this week?",
        ],
      },
      {
        name: "Personal Finance",
        route: "/app/personal-finance",
        tag: "Optional module",
        description:
          "Income and expense tracking with categories and spaces. Ranges are honoured exactly — 'yesterday' means yesterday, never a convenient wider window.",
        examples: [
          "I spent 400 on groceries",
          "How much did I spend yesterday?",
        ],
      },
    ],
  },

  {
    id: "always-on",
    title: "Always-on surfaces",
    intro: "These don't depend on which modules you enabled.",
    entries: [
      {
        name: "Home",
        route: "/app",
        description:
          "Year activity heatmap, active goals, deep-work bars, top habit streak, and open tasks. The heatmap only draws days that have happened — no ghost grid for months still ahead.",
      },
      {
        name: "Weekly report",
        route: "/app/reports",
        description:
          "Last 7 days vs the 7 before, against a trailing 4-week average, per module. Generated and emailed by a Sunday cron, then stored — so the page, the email, and the in-app popup always agree on the same numbers.",
        details: [
          "A toast surfaces the report on your next visit after it's generated.",
          "Cron: /api/cron/weekly-reports, Sundays 09:00 UTC, protected by CRON_SECRET.",
        ],
      },
      {
        name: "Calendar",
        route: "/app/calendar",
        description:
          "Month, week, and timeline views, with Google Calendar connection support.",
      },
      {
        name: "Challenges",
        route: "/app/challenges",
        description:
          "Group challenges with a universal leaderboard — scored across habits, deep work, tasks and challenge check-ins over a rolling 30 days, not just challenge activity.",
      },
      {
        name: "Public profile",
        route: "/app/profile/account",
        description:
          "A shareable /u/{username} page with a habit activity heatmap. Gated by a privacy toggle; nothing is public unless it's on.",
      },
    ],
  },

  {
    id: "how-it-knows-you",
    title: "How it learns who you are",
    intro:
      "Three separate things, deliberately not merged — because measuring what you do, knowing what you want, and remembering what you've said are different problems.",
    entries: [
      {
        name: "Baseline — what you actually do",
        description:
          "Computed live from your own logged data over 28 days: median deep-work hours on active days, longest day, days worked per week, hours logged today, habit completion rate, tasks per week. No AI, no storage, never guessed.",
        details: [
          "Median, not mean — one 14-hour crunch day shouldn't redefine what 'normal' means for you.",
          "Below three logged days it reports insufficient data and the assistant is told to ask rather than assume.",
        ],
      },
      {
        name: "Standards — what you're aiming for",
        route: "/app/profile/standards",
        description:
          "Your target hours, working days per week, protected time, and coaching stance. This exists because behaviour can't tell you intent: someone logging 3h might be over-delivering or falling short, and only they know which.",
        details: [
          "Coaching stance — Push me / Balanced / Protect me — decides whether a long day gets encouragement or a warning.",
          "Nothing is defaulted. An unset target means the assistant asks instead of inventing one.",
        ],
        examples: [
          "I'm aiming for nine hours a day",
          "Stop telling me to rest",
        ],
      },
      {
        name: "Memory — what you've told it",
        route: "/app/profile/personalization",
        description:
          "A running summary the assistant maintains across conversations, plus your nickname, occupation, tone dials and custom instructions. Fully editable — if it believes something wrong about you, fix it there.",
        details: [
          "Currently one text blob the assistant rewrites. A scoped chat/week/month hierarchy is the planned next step.",
        ],
      },
    ],
  },

  {
    id: "assistant-tools",
    title: "Everything Talk can do",
    intro:
      "The full tool list. Availability follows your enabled modules — a tool for a module you turned off isn't offered to the model at all.",
    entries: [
      {
        name: "Habits",
        tag: "Module-gated",
        description:
          "listHabits · toggleHabitToday · toggleHabitChecklistItem · logHabitNumber",
        details: [
          "listHabits returns type, streak, checklist sub-items with ids, and any numeric goal — for whatever date you ask about.",
          "All three write tools accept a date and handle past days.",
        ],
      },
      {
        name: "Tasks",
        tag: "Module-gated",
        description: "getTasks · addNewTask · markTaskAsCompleted",
      },
      {
        name: "Deep Work",
        tag: "Module-gated",
        description:
          "listDeepWorkProjects · logDeepWorkSessions · getDeepWorkSummary",
      },
      {
        name: "Personal Finance",
        tag: "Module-gated",
        description:
          "getFinanceSummary · listRecentTransactions · addTransaction",
      },
      {
        name: "Cross-module",
        tag: "Always on",
        description: "getDayReview · updateMemory · updateWorkStandards",
        details: [
          "getDayReview gathers one whole day across every enabled module in a single call — the backbone of the wind-up flow.",
          "updateWorkStandards only fires when you state a target yourself; it never infers one from what you happened to do.",
        ],
      },
    ],
  },

  {
    id: "settings",
    title: "Settings",
    entries: [
      {
        name: "Account",
        route: "/app/profile/account",
        description:
          "Email, display name, public profile link, and the way in to everything below.",
      },
      {
        name: "Work standards",
        route: "/app/profile/standards",
        description:
          "Targets and coaching stance, shown next to your measured baseline so the gap is visible.",
      },
      {
        name: "Personalization",
        route: "/app/profile/personalization",
        description:
          "Nickname, occupation, tone dials, custom instructions, and editable memory.",
      },
      {
        name: "Preferences",
        route: "/app/profile/preferences",
        description:
          "Age range, phone number, and which modules are switched on.",
      },
      {
        name: "Invite friends",
        route: "/app/profile/referral",
        description: "Referral link and who you've brought in.",
      },
    ],
  },

  {
    id: "gotchas",
    title: "Known gaps & gotchas",
    intro:
      "Honest list. These are real limitations in the current build, not a roadmap.",
    entries: [
      {
        name: "No user timezone",
        description:
          "Day boundaries use server time. Hours-per-day is robust to this; anything hour-precise (a 'typical start time') would be wrong by your UTC offset, which is why it isn't shown.",
      },
      {
        name: "Voice baseline is a snapshot",
        description:
          "A live call's instructions are fixed when the call starts, so hours logged mid-call won't update the baseline the assistant is reasoning from until the next call.",
      },
      {
        name: "Task completion time is approximate",
        description:
          "There's no completed_at column — tasks.updated_at stands in for it. Editing an old completed task moves it in the day's numbers.",
      },
      {
        name: "Voice transcripts aren't saved to chat history",
        description:
          "A live call's transcript is ephemeral; it doesn't persist into the conversation log the way text messages do.",
      },
      {
        name: "Number and checklist detail is per-date",
        description:
          "listHabits and getDayReview return per-item and numeric state for the date you ask about, but the habits page UI still shows that detail for today only.",
      },
    ],
  },
];
