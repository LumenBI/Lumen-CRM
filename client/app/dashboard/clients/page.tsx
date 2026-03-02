import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ClientsView from './ClientsView'

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string, mine?: string }> }) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/')
    }

    const { q: searchTerm = '', mine = 'false' } = await searchParams
    const showMine = mine === 'true'
    const userId = session.user.id

    // Server-side fetch for the first page of clients (Server-First)
    let q = supabase
        .from('clients')
        .select(`
            id, 
            company_name, 
            contact_name, 
            email, 
            phone, 
            origin, 
            commodity, 
            assigned_agent_id, 
            assignment_expires_at, 
            agent:profiles(full_name)
        `);

    if (showMine) {
        q = q.eq('assigned_agent_id', userId);
    }

    if (searchTerm) {
        q = q.or(`company_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data: rawClients } = await q
        .order('id', { ascending: true })
        .limit(50);

    const initialClients = (rawClients || []).map(client => ({
        ...client,
        agent: Array.isArray(client.agent) ? client.agent[0] : client.agent
    })) as any[];

    return (
        <ClientsView initialClients={initialClients} />
    )
}
