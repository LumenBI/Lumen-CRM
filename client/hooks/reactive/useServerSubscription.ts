'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'

export function useServerSubscription(table: string, queryKeys: string[][]) {
    const queryClient = useQueryClient()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const channel = supabase
            .channel(`realtime:${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                () => {
                    queryKeys.forEach(key => {
                        queryClient.invalidateQueries({ queryKey: key })
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [table, queryKeys, queryClient, supabase])
}
