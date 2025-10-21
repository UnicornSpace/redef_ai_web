'use client'
import React, { useState } from 'react';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { waitlistAction } from '@/actions/waitlist';
import { toast } from "sonner"
import Navbar from '@/components/header';

const formSchema = z.object({
  email: z.string()
});
import { FaCheckCircle } from "react-icons/fa";
import Image from 'next/image';

const Page = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),

  })

  const [isEmailSent, setIsEmailSent] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(values);
      const res = await waitlistAction({
        email: values.email
      })
      if (!res.success) {
        toast.error(`Failed to join the waitlist: ${res.error}`);
        return;
      }
      setIsEmailSent(true);

      // toast(
      //   <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
      //     <code className="text-white">{JSON.stringify(values, null, 2)}</code>
      //   </pre>
      // );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }


  return (
    <div className="flex justify-center items-center py-20 min-h-[80dvh]">

      <div className={`w-full max-w-md mx-auto rounded-xl z-50`}>

        <div className="text-center">
          <h2

            className={` text-6xl font-medium mb-4 font-serif`}
          >
            Join our waitlist<span className='text-primary'>*</span>
          </h2>
          <p

            className={`text-lg leading-tight mb-6 font-sans max-w-xl text-balance`}
          >
            Be the first to access new features. Enter your email below to join the waitlist.
          </p>
        </div>

        {isEmailSent ? (
          <div className="mb-4 p-4 text-sm flex items-center justify-center gap-2 transition-all duration-200 animate-in text-green-800 bg-green-100 rounded-lg text-center" role="alert">
            <FaCheckCircle className='text-primary text-xl animate-pulse' />

            <span className="font-medium">Success!</span> You&apos;ve been added to the waitlist.
          </div>
        ) :
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="items-center justify-center max-w-3xl mx-auto flex">
              {/* TODO: make the button and input bigger */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className='gap-0'>
                    <FormLabel></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your email address"

                        type="email"
                        {...field}
                        className='rounded-r-none border-x-[1px] border-gray-600 rounded-l-full'
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className='rounded-l-none rounded-r-full text-white'>Claim Invite</Button>
            </form>
          </Form>}
        <div className="flex justify-center -ml-6 max-h-64 w-full mx-auto max-w-xl mt-12  ">
          <Image
            src="/images/tasks.png"
            alt="Task Management"
            width={120}
            height={120}
            className="object-contain -rotate-12 -mr-12 animate-bounce "
          />
          <Image
            src="/images/calendar.png"
            alt="Task Management"
            width={120}
            height={120}
            className="object-contain animate-bounce"
          />
          <Image
            src="/images/calendar_with_clouds.png"
            alt="Task Management"
            width={75}
            height={75}
            className="object-contain rotate-12 -ml-6 animate-bounce" 
          />
        </div>
      </div>

    </div>
  );
};

export default Page;