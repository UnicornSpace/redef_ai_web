import { HeroVideoDialog } from '@/components/ui/hero-video-dialog'
import React from 'react'

const page = () => {
  // const intro_video = "https://www.youtube.com/watch?v=EHVqOWojgSA"
  const intro_video = "https://www.youtube.com/embed/EHVqOWojgSA"
  return (
    <div className='px-4 py-12'>
      <h1 className='text-5xl md:text-7xl md:leading-16 leading-12 text-center font-serif'>Intro video<span className='text-primary'>*</span></h1>
      {/* <h1 className='text-7xl leading-16 text-center font-serif'>Your desire <br className='hidden '/> to productivity <br />ends here<span className='text-primary'>*</span></h1> */}
      <p className='font-sans text-center mt-1 md:max-w-64 mx-auto'>Voice-first AI powered productivity system for your daily life</p>
      {/* <Link href="/waitlist">
        <Button className='bg-primary text-base flex items-center gap-1 text-white px-20 w-36 py-6 rounded-full'>Get started <TbArrowUpRight />
        </Button>
      </Link> */}
      <div className="relative pt-12 ">
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
      </div>

    </div>
  )
}

export default page
// https://www.youtube.com/watch?v=EHVqOWojgSA