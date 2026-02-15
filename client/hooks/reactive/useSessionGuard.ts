'use client'

import { useEffect } from 'react'
import { useUser } from '@/context/UserContext'
import { createBrowserClient } from '@supabase/ssr'

export function useSessionGuard() {
    const { profile, logout } = useUser()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        if (!profile) return

        const channel = supabase
            .channel(`session-guard:${profile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${profile.id}`
                },
                (payload) => {
                    const newProfile = payload.new as any
                    if (newProfile.role !== profile.role || newProfile.status === 'inactive') {
                        logout()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile, logout, supabase])
}
