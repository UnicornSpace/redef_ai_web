import { supabase } from "@/lib/supabase-client"

async function main(){
    const { error } = await supabase
        .from('tasks')
        .insert({ name: "test", user_id: "ee79e688-81eb-4527-8bdc-818e24b6d92e" })
    console.log(error)
}
main()