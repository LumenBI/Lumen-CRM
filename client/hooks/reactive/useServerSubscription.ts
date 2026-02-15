import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useServerSubscription(table: string, queryKeysToInvalidate: any[][]) {
    const queryClient = useQueryClient();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const channel = supabase
            .channel(`rt-${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    console.log(`[REALTIME] Change detected in ${table}:`, payload);
                    // Invalidate specific query keys
                    queryKeysToInvalidate.forEach((key) => {
                        queryClient.invalidateQueries({ queryKey: key });
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, queryKeysToInvalidate, queryClient, supabase]);
}
