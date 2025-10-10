import { HeroVideoDialog } from '@/components/ui/hero-video-dialog'
import Link from 'next/link';
import React from 'react'
import { TbProgressAlert } from "react-icons/tb";

const page = () => {
  // const intro_video = "https://www.youtube.com/watch?v=EHVqOWojgSA"
  const intro_video = "https://www.youtube.com/embed/EHVqOWojgSA"
  return (
    <div className='px-4 py-12'>
      <h1 className='text-5xl md:text-7xl md:leading-16 leading-12 text-center font-serif'>Demo video<span className='text-primary'>*</span></h1>
      {/* <h1 className='text-7xl leading-16 text-center font-serif'>Your desire <br className='hidden '/> to productivity <br />ends here<span className='text-primary'>*</span></h1> */}
      <p className='font-sans text-center mt-1 md:max-w-64 mx-auto'>Voice-first AI powered productivity system for your daily life</p>
      <div className="mb-4 p-4 text-sm flex items-center justify-center gap-2 transition-all duration-200 animate-in text-red-800 bg-red-100 rounded-lg text-center max-w-2xl mx-auto mt-14" role="alert">
        <TbProgressAlert className='text-primary text-xl animate-pulse' />
        <span className="font-medium">Hey PearX</span> we&apos;re working on getting a better demo. In the meantime, check out our <Link href="/1-min-video" rel="noreferrer" className='underline'>1 min video</Link> to see how it works.
      </div>
      {/* <Link href="/waitlist">
        <Button className='bg-primary text-base flex items-center gap-1 text-white px-20 w-36 py-6 rounded-full'>Get started <TbArrowUpRight />
        </Button>
      </Link> */}
      {/* <div className="relative pt-12 ">
        <HeroVideoDialog
          className="block dark:hidden max-w-4xl mx-auto"
          animationStyle="from-center"
          videoSrc={intro_video}
          thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
          thumbnailAlt="Founders intro video - Redef AI"
        />
        <HeroVideoDialog
          className="hidden dark:block"
          animationStyle="from-center"
          videoSrc={intro_video}
          thumbnailSrc="https://startup-template-sage.vercel.app/hero-dark.png"
          thumbnailAlt="Founders intro video - Redef AI"
        />
      </div> */}

    </div>
  )
}

export default page
{/* <iframe src="https://www.youtube.com/embed/19g66ezsKAg" allowFullScreen /> */ }
// https://www.youtube.com/watch?v=EHVqOWojgSA