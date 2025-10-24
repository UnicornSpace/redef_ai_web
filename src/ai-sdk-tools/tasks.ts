import { createClient } from "@/lib/server";
import { tool } from "ai";
import z from "zod";

export const getSecretPinTool = tool({
    description: 'Get the secret pin of the user',
    inputSchema: z.object({
    }),
    execute: async () => {

        return {
            data: "1234"
        };
    },
})
export const getTasksTool = tool({
    description: 'Get the tasks or todos of the user',
    inputSchema: z.object({
        isCompleted: z.boolean().default(false).optional().describe("hey use this as true when user wants incomplete tasks")
    }),
    execute: async ({ isCompleted }) => {
        const supabase = await createClient()   
        const { data, error } = await supabase
            .from('tasks')
            .select().eq("is_completed", isCompleted)
        console.log(error)
        if (error) {
            return {
                error: error.message,
            };
        }
        return {
            data: formatTasks(data) || [],
        };
    },
})

export const markTaskAsCompletedTool = tool({
    description: 'Mark a task as completed',
    inputSchema: z.object({
        taskId: z.string().describe("the id of the task")
    }),
    execute: async ({ taskId }) => {
        const supabase = await createClient()
        const { data: user, error: authError } = await supabase.auth.getUser()
        if (authError) {
            return {
                error: authError.message
            };
        }
        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: true })
            .eq('id', taskId)
            .eq('user_id', user.user.id)
        if (error) {
            console.error("ERR", error)
            return {
                error: error.message
            };
        }
        return {
            data: "Task marked as completed"
        };
    },
})

export const addTasksTool = tool({
    description: 'Add a new task or a todo',
    inputSchema: z.object({
        name: z.string().describe("the name of the task or todo")
    }),
    execute: async ({ name }) => {
        const supabase = await createClient()
        const { data: user, error: authError } = await supabase.auth.getUser()
        if (authError) {
            return {
                error: authError.message
            };
        }
        // // get your public.users row that matches the auth user
        // const { data: profile } = await supabase
        //     .from('users')
        //     .select('id')
        //     .eq('auth_user_id', user.user.id)
        //     .single()

        console.log("name", name)
        console.log("user", user.user.id)
        const { error } = await supabase
            .from('tasks')
            .insert({ name: name, user_id: user.user.id })
        if (error) {
            console.error("ERR", error)

            return {
                error: error.message
            };
        }
        return {
            data: "Task added successfully"
        };
    },
})


// @ts-ignore
function formatTasks(tasks) {
    // Group tasks by category
    // @ts-ignore
    const grouped = tasks.reduce((acc, task) => {
        const category = task.category || "General"
        if (!acc[category]) acc[category] = []
        acc[category].push({ id: task.id, name: task.name })
        return acc
    }, {})
    
    // Convert to formatted string
    const formatted = Object.entries(grouped)
    .map(([category, items]) => {
        const header =
        category === "General" ? "General" : `${category} category:`
        // @ts-ignore
            const list = items.map(item => `- ${item.name} (ID: ${item.id})`).join("\n")
            return `${header}\n${list}`
        })
        .join("\n\n")

    return formatted
}