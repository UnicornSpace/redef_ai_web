/**
 * The FAQ content shown on both the homepage (faq.tsx) and pricing page
 * (faq-section.tsx) — those components render it as JSX, so this plain-text
 * copy exists for FAQPage JSON-LD, which needs strings. Keep in sync if the
 * on-page FAQ copy changes.
 */
export const SITE_FAQS: { q: string; a: string }[] = [
  {
    q: "What is this and who is it for?",
    a: "We're building the first voice-native productivity companion for busy professionals, founders, and creators who are tired of juggling fragmented tools. If you're scattered across calendars, task apps, and habit trackers, we're here to bring it all into one integrated flow.",
  },
  {
    q: "How does voice-first productivity work?",
    a: "Instead of manually clicking and typing into multiple apps, you simply speak what matters. Your companion understands your intent, manages your calendar, tracks your tasks and habits, and provides insights—all through natural conversation. It's productivity that works for you, not against you.",
  },
  {
    q: "What makes this different from other productivity tools?",
    a: "While other tools like Notion, Todoist, or Google Calendar require manual input across separate apps, we're voice-first and fully integrated. Everything—calendar, tasks, habits, deep work—lives in one unified brain. We're not another tool to manage; we're the system that manages itself for you.",
  },
  {
    q: "Do I need to replace my existing calendar or task apps?",
    a: "Not immediately. Our free tier lets you test the value without commitment. Many users start by using our voice logging alongside their existing tools, then gradually transition as they see the time saved and clarity gained. You're in control of how fast you adopt the new system.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use enterprise-grade security measures including end-to-end encryption and secure data storage. Your productivity data is private and protected. We're building trust, not just a product.",
  },
  {
    q: "How do I get started?",
    a: "Getting started is simple! Sign up for our free tier, start using voice logging for your tasks and calendar, and see how it feels. Our system helps you understand your patterns, track progress, and get back control of your time—no credit card required to start.",
  },
];
