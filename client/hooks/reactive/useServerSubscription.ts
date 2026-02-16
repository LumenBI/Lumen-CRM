'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Escucha cambios en tiempo real en una tabla de Supabase y refrezca las queries relacionadas.
 * @param table - Nombre de la tabla a escuchar (ej: 'deals', 'clients')
 * @param queryKeys - Array de QueryKeys de React Query a invalidar cuando haya cambios.
 */
export function useServerSubscription(table: string, queryKeys: any[][]) {
    const queryClient = useQueryClient()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel(`realtime-${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                },
                () => {
                    queryKeys.forEach((key) => {
                        queryClient.invalidateQueries({ queryKey: key })
                    })

                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [table, queryClient, router, supabase, ...queryKeys.map(k => JSON.stringify(k))])
}