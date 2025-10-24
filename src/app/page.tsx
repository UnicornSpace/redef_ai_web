import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import React from 'react'
import { FiArrowRight } from "react-icons/fi";
import { TbArrowRight, TbArrowUpRight, TbCalendar, TbChecklist, TbSparkles } from "react-icons/tb";
import Image from 'next/image';
// import posthog from 'posthog-js';


const page = async () => {
  // posthog.capture('my event', { property: 'value' })
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  const { data, error } = await supabase
    .from('task')
    .select()
  console.log(data)
  return (
    <div className="max-w-5xl mx-auto">
      <main className='flex flex-col items-center justify-center min-h-[80dvh]  gap-6 '>

        <h1 className='text-5xl md:text-7xl md:leading-16 leading-12 text-center font-serif'>Your desire <br className='' /> to productivity <br />ends here<span className='text-primary'>*</span></h1>
        {/* <h1 className='text-7xl leading-16 text-center font-serif'>Your desire <br className='hidden '/> to productivity <br />ends here<span className='text-primary'>*</span></h1> */}
        <p className='font-sans text-center max-w-64'>Voice-first AI powered productivity system for your daily life</p>
        <Link href="/waitlist" className='group' >
          <Button className='bg-primary text-base flex items-center gap-1 text-white px-20 w-36 py-6 rounded-full'>Get started <TbArrowRight className='group-hover:-rotate-45 transition-all duration-150 animate-in' />
          </Button>
        </Link>
      </main>

      {/* Features Section */}
      <section className="py-12 max-w-2xl mx-auto px-4">
        {/* <h2 className="text-3xl font-bold text-center mb-12">Boost Your Productivity</h2> */}

        {/* Calendar Feature */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-4">
          <div className="md:w-1/2">
            <h3 className="text-3xl font-medium mb-2 font-serif">Smart Calendar</h3>
            <p className="text-gray-600">Organize your schedule with our intuitive calendar that syncs across all your devices.</p>
          </div>
          <div className="md:w-1/2">
            <div className="relative h-64 w-full">
              <Image
                src="/images/calendar.png"
                alt="Smart Calendar"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Tasks Feature */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12 mb-4">
          <div className="md:w-1/2">
            <h3 className="text-3xl font-medium mb-2 font-serif">Task Management</h3>
            <p className="text-gray-600">Keep track of your to-dos and never miss a deadline with our powerful task manager.</p>
          </div>
          <div className="md:w-1/2">
            <div className="relative h-64 w-full">
              <Image
                src="/images/tasks.png"
                alt="Task Management"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* AI Assistant Feature */}
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <h3 className="text-3xl font-medium mb-2 font-serif">AI Assistant</h3>
            <p className="text-gray-600">Get personalized productivity insights and suggestions powered by AI.</p>
          </div>
          <div className="md:w-1/2">
            <div className="relative h-64 w-full">
              <Image
                src="/images/calendar_with_clouds.png"
                alt="Task Management"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default page