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

        // Get Google Provider Token if available
        const providerToken = session.provider_token

        if (!providerToken && url.includes('/mail')) {
            console.warn('WARNING: Accessing /mail route but session.provider_token is missing. This will cause re-authorization requirements.');
        }

        return fetch(url, {
            ...options,
            headers: {
                ...options?.headers,
                'Authorization': `Bearer ${session.access_token}`,
                // Automatically include Google token if it exists in session
                ...(providerToken ? { 'x-google-token': providerToken } : {})
            },
        })
    }, [supabase])

    return { authFetch, supabase }
}
