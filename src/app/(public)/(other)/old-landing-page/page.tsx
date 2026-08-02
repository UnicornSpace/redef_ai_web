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
              <section className="py-12 lg:py-20">
                <div className=" mx-auto w-full rounded-md p-8">
                  <div className="space-y-2">
                    <Badge variant="outline" className="">
                      Download Now!
                    </Badge>
                    <h4 className="font-heading text-3xl">Download our mobile app.</h4>
                    <p className="text-muted-foreground text-base">
                      Mobile banking app for IOS & Android to manage your online money.
                    </p>
                  </div>
                  <div className="mt-6 flex gap-4">
                    <Button className="h-auto">
                      <Link href="https://play.google.com/store/apps/details?id=com.redefai.app">
                      </Link>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="size-7 shrink-0"
                        viewBox="0 0 16 16">
                        <path d="M14.222 9.374c1.037-.61 1.037-2.137 0-2.748L11.528 5.04 8.32 8l3.207 2.96zm-3.595 2.116L7.583 8.68 1.03 14.73c.201 1.029 1.36 1.61 2.303 1.055zM1 13.396V2.603L6.846 8zM1.03 1.27l6.553 6.05 3.044-2.81L3.333.215C2.39-.341 1.231.24 1.03 1.27" />
                      </svg>
                      <div className="ms-1 flex flex-col text-start">
                        <span className="block text-xs font-light">Get in on</span>
                        <span className="block font-medium">Google Play</span>
                      </div>
                    </Button>
                    <Button className="h-auto" disabled>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="size-8 shrink-0"
                        viewBox="0 0 16 16">
                        <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
                        <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
                      </svg>
                      <div className="ms-1 flex flex-col text-start">
                        <span className="block text-xs font-light">Download from</span>
                        <span className="block font-medium">App Store</span>
                      </div>
                      <span>coming soon...</span>
                    </Button>
                  </div>
                </div>
              </section>
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
