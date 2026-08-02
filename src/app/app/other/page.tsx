// import { supabase } from '@/lib/supabase-client'
import React from "react";
import { createClient } from "@/lib/server";

const page = async () => {
  const supabase = await createClient();
  const waitlist = await supabase.from("tasks").select();
  console.log("--------------💕💕💕", waitlist);

  // const {data, error} = await supabase.auth.signInWithPassword({
  //     email: "mohdfaizan13123@gmail.com",
  //     password:"password"
  // })

  // const { data, error } = await supabase.auth.getUser()
  // console.log("👌", data, error)
  // const userSession = await supabase.auth.getSession()
  // console.log("😊", userSession.data)
  // console.log(data, error)
  // const { data, error } = await supabase
  //     .from('tasks')
  //     .select()
  // console.log(data)
  return (
    <div>
      <pre>{JSON.stringify(waitlist.data, null, 2)}</pre>
      {/* {!data.user ? "unauthenticated" : `authenticated ${data.user.email}`} */}
    </div>
  );
};

export default page;
