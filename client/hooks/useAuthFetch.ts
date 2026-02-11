'use client'

import { useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

/**
 * Custom hook that wraps the repeated createClient → getSession → fetch pattern.
 * Replaces 15+ duplicate instances of this auth boilerplate across the codebase.
 */
export function useAuthFetch() {
    const supabase = createClient()

    const authFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No active session')

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
