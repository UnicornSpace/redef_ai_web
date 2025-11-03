import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="">
      <main className="flex flex-col items-center justify-center  mb-24  gap-6 ">
        <h1 className="text-5xl md:text-7xl md:leading-16 leading-12 text-center font-normal font-serif">
          Your desire <br className="" /> to productivity <br />
          ends here<span className="text-primary">*</span>
        </h1>
        {/* <h1 className='text-7xl leading-16 text-center font-serif'>Your desire <br className='hidden '/> to productivity <br />ends here<span className='text-primary'>*</span></h1> */}
        <p className="font-sans text-center max-w-64">
          Voice-first AI powered productivity system for your daily life
        </p>
        <div className="w-full max-w-[497px] lg:w-[497px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
          <div className="backdrop-blur-[8.25px] flex justify-start items-center gap-4">
            <Link
              href={"/talk"}
              className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center"
            >
              <div className="w-20 sm:w-24 md:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-linear-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
              <div className="flex flex-col justify-center text-white text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans">
                Start for free
              </div>
            </Link>
          </div>
        </div>
        {/* <Link href="/waitlist" className="group">
                  <Button className="bg-primary text-base flex items-center gap-1 text-white px-20 w-36 py-6 rounded-full">
                    Get started{" "}
                    <TbArrowRight className="group-hover:-rotate-45 transition-all duration-150 animate-in" />
                  </Button>
                </Link> */}
      </main>
      <div className="absolute top-[232px] sm:top-[248px] md:top-[264px] lg:top-[320px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
        <img
          src="/mask-group-pattern.svg"
          alt=""
          className="w-[936px] sm:w-[1404px] md:w-[2106px] lg:w-[2808px] h-auto opacity-30 sm:opacity-40 md:opacity-50 mix-blend-multiply"
          style={{
            filter: "hue-rotate(15deg) saturate(0.7) brightness(1.2)",
          }}
        />
      </div>
    </section>
  );
}
