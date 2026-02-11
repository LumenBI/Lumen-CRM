'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useApi } from '@/hooks/useApi'

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
    agents: Agent[]
    refreshAgents: () => Promise<void>
    loading: boolean
}

const AgentsContext = createContext<AgentsContextType | undefined>(undefined)

export function AgentsProvider({ children }: { children: React.ReactNode }) {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const { users: usersApi } = useApi()

    const fetchAgents = useCallback(async () => {
        try {
            const data = await usersApi.getAll()
            setAgents(data)
        } catch (error) {
            console.error('Error fetching agents:', error)
        } finally {
            setLoading(false)
        }
    }, [usersApi])

    useEffect(() => {
        fetchAgents()
    }, [fetchAgents])

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
