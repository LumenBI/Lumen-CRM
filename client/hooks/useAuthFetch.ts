'use client'

import { useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export function useAuthFetch() {
    const supabase = createClient()

    const authFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            console.error('Supabase getSession error:', error)
            throw new Error(`Session Error: ${error.message}`)
        }

        if (!session) {
            console.warn('No session found in useAuthFetch')
            throw new Error('No active session')
        }

        return fetch(url, {
            ...options,
            headers: {
                ...options?.headers,
                Authorization: `Bearer ${session.access_token}`,
            },
        })
    }, [])

    return { authFetch, supabase }
}
