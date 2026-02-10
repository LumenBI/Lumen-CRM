'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useUser } from '@/context/UserContext'
import type { Client } from '@/types'

interface ClientsContextType {
    /** All clients — for read-only views (Clients page) */
    allClients: Client[]
    /** Clients assigned to the current user — for action contexts (modals) */
    myClients: Client[]
    /** Client-side search over myClients */
    searchClients: (query: string) => Client[]
    /** Client-side search over allClients */
    searchAllClients: (query: string) => Client[]
    /** Manual refresh */
    refreshClients: () => Promise<void>
    loading: boolean
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export function ClientsProvider({ children }: { children: React.ReactNode }) {
    const [allClients, setAllClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const { profile } = useUser()
    const supabase = createClient()

    const fetchClients = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setAllClients(data)
            }
        } catch (error) {
            console.error('Error fetching clients:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        fetchClients()
    }, [fetchClients])

    // Supabase real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('clients-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, (payload) => {
                setAllClients(prev => [...prev, payload.new as Client])
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, (payload) => {
                setAllClients(prev =>
                    prev.map(c => c.id === (payload.new as Client).id ? (payload.new as Client) : c)
                )
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clients' }, (payload) => {
                setAllClients(prev => prev.filter(c => c.id !== (payload.old as Client).id))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Least privilege: filter by assigned_agent_id for non-admin roles
    const myClients = useMemo(() => {
        if (!profile) return []
        if (profile.role === 'ADMIN' || profile.role === 'MANAGER') {
            return allClients
        }
        return allClients.filter(c => c.assigned_agent_id === profile.id)
    }, [allClients, profile])

    const searchClients = useCallback((query: string): Client[] => {
        if (!query || query.length < 2) return myClients
        const q = query.toLowerCase()
        return myClients.filter(c =>
            c.company_name.toLowerCase().includes(q) ||
            c.contact_name.toLowerCase().includes(q)
        )
    }, [myClients])

    const searchAllClients = useCallback((query: string): Client[] => {
        if (!query || query.length < 2) return allClients
        const q = query.toLowerCase()
        return allClients.filter(c =>
            c.company_name.toLowerCase().includes(q) ||
            c.contact_name.toLowerCase().includes(q)
        )
    }, [allClients])

    return (
        <ClientsContext.Provider value={{
            allClients,
            myClients,
            searchClients,
            searchAllClients,
            refreshClients: fetchClients,
            loading,
        }}>
            {children}
        </ClientsContext.Provider>
    )
}

export function useClients() {
    const context = useContext(ClientsContext)
    if (context === undefined) {
        throw new Error('useClients must be used within a ClientsProvider')
    }
    return context
}
