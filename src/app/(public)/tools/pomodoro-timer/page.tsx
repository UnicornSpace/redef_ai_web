import type { Metadata } from "next";
import { habitTrackerConfig } from "@/lib/tools-config";
import { generateToolMetadata } from "@/lib/tool-metadata";
import { ToolLandingTemplate } from "@/components/tool-landing/tool-landing-template";

export const metadata: Metadata = generateToolMetadata(habitTrackerConfig);
// https://bundui.io/motion/components/countdown
export default function HabitTrackerLandingPage() {
  return <div>

    hi
  </div>;
}
