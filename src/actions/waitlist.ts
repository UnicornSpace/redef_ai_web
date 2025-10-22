"use server"

import { createClient } from "@supabase/supabase-js";


export const waitlistAction = async (data: { email: string, preferred_device: string }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
    // Here you can handle the form submission, e.g., save to database
    console.log("Form submitted with data:", data);
    const { error } = await supabase
        .from('waitlist')
        .insert({ email: data.email, preferred_device: data.preferred_device || null })
    if (error) {
        console.error("Error inserting data:", error);
        return { success: false, error: error.message };
    }
    return { success: true };
};