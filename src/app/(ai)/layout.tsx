import { ReactNode } from "react"
import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/server'

export default async function ({ children }: { children: ReactNode }) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getClaims()
    console.log("from layout (ai)")
    console.log(data,error)
    console.log("from layout (ai) - end")
    if (error || !data?.claims) {
        redirect('/auth/login')
    }
    return (
        <div>{children}</div>
    )
}