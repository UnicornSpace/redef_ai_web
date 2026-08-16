import type { Metadata } from "next";
import { weeklyGoalPlannerConfig } from "@/lib/tools-config";
import { generateToolMetadata } from "@/lib/tool-metadata";
import { ToolLandingTemplate } from "@/components/tool-landing/tool-landing-template";

export const metadata: Metadata = generateToolMetadata(weeklyGoalPlannerConfig);

export default function WeeklyGoalPlannerLandingPage() {
  return <ToolLandingTemplate tool={weeklyGoalPlannerConfig} />;
}
