import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import React from 'react'
import { FiArrowRight } from "react-icons/fi";
import { TbArrowRight, TbArrowUpRight } from "react-icons/tb";


const page = async () => {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  const { data, error } = await supabase
    .from('task')
    .select()
  console.log(data)
  return (
    <div className="">
      <main className='flex flex-col items-center justify-center min-h-[80dvh]  gap-6 '>

        <h1 className='text-5xl md:text-7xl md:leading-16 leading-12 text-center font-serif'>Your desire <br className='' /> to productivity <br />ends here<span className='text-primary'>*</span></h1>
        {/* <h1 className='text-7xl leading-16 text-center font-serif'>Your desire <br className='hidden '/> to productivity <br />ends here<span className='text-primary'>*</span></h1> */}
        <p className='font-sans text-center max-w-64'>Voice-first AI powered productivity system for your daily life</p>
        <Link href="/waitlist" className='group' >
          <Button className='bg-primary text-base flex items-center gap-1 text-white px-20 w-36 py-6 rounded-full'>Get started <TbArrowRight className='group-hover:-rotate-45 transition-all duration-150 animate-in' />
          </Button>
        </Link>
      </main>
    </div>
  )
}

export default page