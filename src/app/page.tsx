// "use client";

import CTASection from "@/components/landingpage/cta-section";
import DocumentationSection from "@/components/landingpage/documentation-section";
import EffortlessIntegration from "@/components/landingpage/effortless-integration-updated";
import FAQSection from "@/components/landingpage/faq-section";
import FooterSection from "@/components/landingpage/footer-section";
import NumbersThatSpeak from "@/components/landingpage/numbers-that-speak";
import PricingSection from "@/components/landingpage/pricing-section";
import SmartSimpleBrilliant from "@/components/landingpage/smart-simple-brilliant";
import TestimonialsSection from "@/components/landingpage/testimonials-section";
import YourWorkInSync from "@/components/landingpage/your-work-in-sync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { TbArrowRight } from "react-icons/tb";
import { SiSocialblade } from "react-icons/si";
import BentoGrid from "@/components/landingpage/bento-grids";
import { HeroSection } from "@/components/landingpage/hero-section";
import Navbar from "@/components/landingpage/navbar";

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen relative bg-[#F7F5F3] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation */}
            <Navbar />

            <div className="pt-40  sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full sm:pl-0 sm:pr-0 pl-0 pr-0">
              <HeroSection />
              <BentoGrid />
              {/* <DocumentationSection /> */}
              <TestimonialsSection />
              <FAQSection />
              <CTASection />
              <FooterSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
