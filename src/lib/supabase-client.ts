import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
export const supabase = createClient("https://lprinhfwtfsfrbnpbkme.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvb3ZzZGRoZWNvcG9ha25pYmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NjM2MDcsImV4cCI6MjA3NTEzOTYwN30.uLH4aa5-Q4oM_9fYipqjUWteLOAfSp27wFExOFMV33I")
// export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)