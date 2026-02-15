import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useSessionGuard() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const userId = session.user.id;

            // Subscribe to profile changes for the current user
            const channel = supabase
                .channel(`guard-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${userId}`,
                    },
                    (payload: RealtimePostgresChangesPayload<any>) => {
                        console.log('[SESSION_GUARD] Profile update detected:', payload.new);
                        const { status } = payload.new as any;

                        // Kill Switch Logic
                        if (status === 'INACTIVE' || status === 'SUSPENDED') {
                            console.warn('[SESSION_GUARD] Account is no longer active. Signing out.');
                            supabase.auth.signOut().then(() => {
                                router.push('/login');
                            });
                        }
                    }
                )
                .subscribe();

            return channel;
        };

        let activeChannel: any;
        checkSession().then(channel => {
            activeChannel = channel;
        });

        return () => {
            if (activeChannel) {
                supabase.removeChannel(activeChannel);
            }
        };
    }, [supabase, router]);
}
