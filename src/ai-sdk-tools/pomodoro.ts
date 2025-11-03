import { createClient } from "@/lib/server";
import { tool } from "ai";
import z from "zod";

export const pomodoroHoursTool = tool({
    description: "get the pomodoro(aka deep work or focus time) hours of the user based on today",
    inputSchema: z.object({
    }),
    execute: async () => {
        console.log("pomodoroHoursTool")
        const supabase = await createClient()
        const { data: user, error: authError } = await supabase.auth.getUser()
        if (authError) {
            return {
                error: authError.message
            };
        }
        console.log("user", user)
        const { start, end } = getUTCDateRange(new Date());

        const { data: pomodoroData, error: pomodoroError } = await supabase
            .from("pomodoros")
            .select("*")
            .eq("user_id", user.user.id)
            .gte("created_at", start)
            .lte("created_at", end);

        if (pomodoroError) {
            return {
                error: pomodoroError.message
            };
        }
        const totalPomodoroHours = pomodoroData.reduce((acc: number, curr: any) => acc + curr.focus_time, 0);
        console.log("totalPomodoroHours", totalPomodoroHours)
        console.log("pomodoroData", pomodoroData)
        console.log("pomodoroError", pomodoroError)
        return {
            data: totalPomodoroHours / 60 // convert minutes to hours
        };
    },
})


function getUTCDateRange(date = new Date()) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

    return {
        start: start.toISOString(), // e.g. "2025-11-02T00:00:00.000Z"
        end: end.toISOString(),     // e.g. "2025-11-02T23:59:59.999Z"
    };
}
