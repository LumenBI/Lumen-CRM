'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface Agent {
    id: string
    full_name: string
    email: string
    role?: string
    is_active?: boolean
    status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
    created_at?: string
}

interface AgentsContextType {
    /** All agents/users */
    agents: Agent[]
    /** Manual refresh */
    refreshAgents: () => Promise<void>
    loading: boolean
}

const AgentsContext = createContext<AgentsContextType | undefined>(undefined)

export function AgentsProvider({ children }: { children: React.ReactNode }) {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchAgents = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setAgents(data)
            }
        } catch (error) {
            console.error('Error fetching agents:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        fetchAgents()
    }, [fetchAgents])

    // Supabase real-time subscription on profiles table
    useEffect(() => {
        const channel = supabase
            .channel('profiles-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
                setAgents(prev => [...prev, payload.new as Agent])
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                setAgents(prev =>
                    prev.map(a => a.id === (payload.new as Agent).id ? (payload.new as Agent) : a)
                )
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, (payload) => {
                setAgents(prev => prev.filter(a => a.id !== (payload.old as Agent).id))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <AgentsContext.Provider value={{ agents, refreshAgents: fetchAgents, loading }}>
            {children}
        </AgentsContext.Provider>
    )
}

export function useAgents() {
    const context = useContext(AgentsContext)
    if (context === undefined) {
        throw new Error('useAgents must be used within an AgentsProvider')
    }
    return context
}
