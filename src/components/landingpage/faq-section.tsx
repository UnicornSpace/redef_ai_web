"use client"

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is this and who is it for?",
    answer:
      "We're building the first voice-native productivity companion for busy professionals, founders, and creators who are tired of juggling fragmented tools. If you're scattered across calendars, task apps, and habit trackers, we're here to bring it all into one integrated flow.",
  },
  {
    question: "How does voice-first productivity work?",
    answer:
      "Instead of manually clicking and typing into multiple apps, you simply speak what matters. Your companion understands your intent, manages your calendar, tracks your tasks and habits, and provides insights—all through natural conversation. It's productivity that works for you, not against you.",
  },
  {
    question: "What makes this different from other productivity tools?",
    answer:
      "While other tools like Notion, Todoist, or Google Calendar require manual input across separate apps, we're voice-first and fully integrated. Everything—calendar, tasks, habits, deep work—lives in one unified brain. We're not another tool to manage; we're the system that manages itself for you.",
  },
  {
    question: "Do I need to replace my existing calendar or task apps?",
    answer:
      "Not immediately. Our free tier lets you test the value without commitment. Many users start by using our voice logging alongside their existing tools, then gradually transition as they see the time saved and clarity gained. You're in control of how fast you adopt the new system.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use enterprise-grade security measures including end-to-end encryption and secure data storage. Your productivity data is private and protected. We're building trust, not just a product.",
  },
  {
    question: "How do I get started?",
    answer:
      "Getting started is simple! Sign up for our free tier, start using voice logging for your tasks and calendar, and see how it feels. Our system helps you understand your patterns, track progress, and get back control of your time—no credit card required to start.",
  },
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="w-full flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="w-full flex flex-col justify-center text-[#49423D] font-medium leading-tight md:leading-[44px] font-serif text-4xl tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="w-full text-[#605A57] text-base font-normal leading-6 font-sans">
            Everything you need to know about our voice-first
            <br className="hidden md:block" />
            productivity system.
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-[#49423D] text-base font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-[18px] text-[#605A57] text-sm font-normal leading-6 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
