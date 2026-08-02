import type { Metadata } from "next";
import { habitTrackerConfig } from "@/lib/tools-config";
import { generateToolMetadata } from "@/lib/tool-metadata";
import { ToolLandingTemplate } from "@/components/tool-landing/tool-landing-template";

export const metadata: Metadata = generateToolMetadata(habitTrackerConfig);

export default function HabitTrackerLandingPage() {
  return <ToolLandingTemplate tool={habitTrackerConfig} />;
}
