import Link from 'next/link';
import React from 'react'
import { Button } from './ui/button';
import { TbArrowUpRight } from 'react-icons/tb';

const Navbar = () => {
    return (

        <header className='py-4 rounded-full flex items-center justify-between max-w-2xl mx-auto px-4'>
            <Link href={"/"} className='font-serif font-medium text-2xl'>
                <span className='bg-primary px-[2px] rounded-sm'>
                    <span className='text-white'>*R</span>
                </span>
                edef AI</Link>
            <section>
                <Link  href="/waitlist">
                    <Button className='text-xl text-black' variant={"link"}>Join
                    </Button>
                </Link>
            </section>
        </header>

    )
}

export default Navbar