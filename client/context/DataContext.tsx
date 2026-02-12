'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useApi } from '@/hooks/useApi'
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
        fetchData()
    }, [fetchData])

    useEffect(() => {
        const channel = supabase
            .channel('app-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchData, supabase])

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