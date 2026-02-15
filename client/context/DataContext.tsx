'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useApi } from '@/hooks/useApi'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/utils/supabase/client'
import type { Client, Deal, Appointment, Interaction } from '@/types'

interface DataContextType {
    stats: any | null
    activities: Interaction[]
    history: any[]
    clients: Client[]
    deals: any
    appointments: Appointment[]
    agents: any[]
    loading: boolean
    refreshAll: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [stats, setStats] = useState<any | null>(null)
    const [activities, setActivities] = useState<Interaction[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [deals, setDeals] = useState<any>(null)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [agents, setAgents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useUser()
    const { bootstrap } = useApi()
    const supabase = createClient()

    const fetchData = useCallback(async () => {
        try {
            const data = await bootstrap.get()
            setStats(data.stats)
            setActivities(data.activities)
            setHistory(data.history)
            setClients(data.clients)
            setDeals(data.kanban)
            setAppointments(data.appointments)
            setAgents(data.agents)
        } catch (error) {
            console.error('Error fetching bootstrap data:', error)
        } finally {
            setLoading(false)
        }
    }, [bootstrap])

    useEffect(() => {
        if (user) {
            fetchData()
        } else {
            setLoading(false)
        }
    }, [fetchData, user])

    useEffect(() => {
        const channel = supabase
            .channel('app-realtime-global')
            // Interactions/Activities
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interactions' }, (payload) => {
                setActivities(prev => [payload.new as Interaction, ...prev].slice(0, 50))
            })
            // Appointments (handled here as generic activity)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                // For appointments, we might still want to refresh stats or the specific list
                // but let's be more targeted if possible. For now, just refresh stats.
                // fetchData() is still expensive but let's see if we can just refresh stats
            })
            // Deals/Kanban
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
                // If DealsContext handles this, we can remove it here.
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    // NOTE: Statistics and History might still need periodic or event-driven refreshes
    // but they shouldn't trigger a full client/agent/deal reload if those are handled elsewhere.

    const value = useMemo(() => ({
        stats,
        activities,
        history,
        clients,
        deals,
        appointments,
        agents,
        loading,
        refreshAll: fetchData
    }), [stats, activities, history, clients, deals, appointments, agents, loading, fetchData])

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    )
}

export function useData() {
    const context = useContext(DataContext)
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider')
    }
    return context
}