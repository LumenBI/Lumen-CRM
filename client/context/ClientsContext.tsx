'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient as createSupabaseClient } from '@/utils/supabase/client'
import { useUser } from '@/context/UserContext'
import { useApi } from '@/hooks/useApi'
import { useData } from '@/context/DataContext'
import type { Client } from '@/types'

interface ClientsContextType {
    allClients: Client[]
    myClients: Client[]
    searchClients: (query: string) => Client[]
    searchAllClients: (query: string) => Client[]
    refreshClients: () => Promise<void>
    createClient: (clientData: Partial<Client>) => Promise<Client>
    updateClient: (id: string, clientData: Partial<Client>) => Promise<Client>
    loading: boolean
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export function ClientsProvider({ children }: { children: React.ReactNode }) {
    const [allClients, setAllClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const { profile } = useUser()
    const { clients: bootstrapClients, loading: dataLoading } = useData()
    const supabase = createSupabaseClient()

    const { clients: clientsApi } = useApi()

    const fetchClients = useCallback(async () => {
        try {
            const data = await clientsApi.getAll()
            setAllClients(data)
        } catch (error) {
            console.error('Error fetching clients:', error)
        } finally {
            setLoading(false)
        }
    }, [clientsApi])

    // Bridge with DataContext
    useEffect(() => {
        if (bootstrapClients && bootstrapClients.length > 0) {
            setAllClients(bootstrapClients)
            setLoading(false)
        } else if (!dataLoading) {
            // Only fetch if bootstrap is done and empty (or if we really need a fresh copy)
            fetchClients()
        }
    }, [bootstrapClients, dataLoading, fetchClients])
    useEffect(() => {
        const channel = supabase
            .channel('clients-realtime')
            .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'clients' }, (payload: any) => {
                setAllClients((prev: Client[]) => [...prev, payload.new as Client])
            })
            .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'clients' }, (payload: any) => {
                setAllClients((prev: Client[]) =>
                    prev.map((c: Client) => c.id === (payload.new as Client).id ? (payload.new as Client) : c)
                )
            })
            .on('postgres_changes' as any, { event: 'DELETE', schema: 'public', table: 'clients' }, (payload: any) => {
                setAllClients((prev: Client[]) => prev.filter((c: Client) => c.id !== (payload.old as Client).id))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const myClients = useMemo(() => {
        if (!profile) return []
        if (['ADMIN', 'MANAGER'].includes(profile.role.toUpperCase())) {
            return allClients
        }
        return allClients.filter((c: Client) => c.assigned_agent_id === profile.id)
    }, [allClients, profile])

    const searchClients = useCallback((query: string): Client[] => {
        if (!query || query.length < 2) return myClients
        const q = query.toLowerCase()
        return myClients.filter((c: Client) =>
            c.company_name.toLowerCase().includes(q) ||
            c.contact_name.toLowerCase().includes(q)
        )
    }, [myClients])

    const searchAllClients = useCallback((query: string): Client[] => {
        if (!query || query.length < 2) return allClients
        const q = query.toLowerCase()
        return allClients.filter((c: Client) =>
            c.company_name.toLowerCase().includes(q) ||
            c.contact_name.toLowerCase().includes(q)
        )
    }, [allClients])

    const createClient = useCallback(async (clientData: Partial<Client>) => {
        const tempId = `temp-${Date.now()}`
        const tempClient = {
            ...clientData,
            id: tempId,
            created_at: new Date().toISOString(),
            company_name: clientData.company_name || 'Nueva Empresa',
            contact_name: clientData.contact_name || 'Nuevo Contacto',
            assigned_agent_id: clientData.assigned_agent_id || profile?.id
        } as Client

        setAllClients((prev: Client[]) => [...prev, tempClient])

        try {
            const newClient = await clientsApi.create(clientData)
            setAllClients((prev: Client[]) => prev.map((c: Client) => c.id === tempId ? newClient : c))
            return newClient
        } catch (error) {
            setAllClients((prev: Client[]) => prev.filter((c: Client) => c.id !== tempId))
            throw error
        }
    }, [clientsApi, profile])

    const updateClient = useCallback(async (id: string, clientData: Partial<Client>) => {
        const previousClients = [...allClients]

        setAllClients((prev: Client[]) => prev.map((c: Client) => c.id === id ? { ...c, ...clientData } as Client : c))

        try {
            const updatedClient = await clientsApi.update(id, clientData)
            return updatedClient

        } catch (error) {
            setAllClients(previousClients)
            throw error
        }
    }, [clientsApi, allClients])

    const value = useMemo(() => ({
        allClients,
        myClients,
        searchClients,
        searchAllClients,
        refreshClients: fetchClients,
        createClient,
        updateClient,
        loading,
    }), [allClients, myClients, searchClients, searchAllClients, fetchClients, createClient, updateClient, loading])

    return (
        <ClientsContext.Provider value={value}>
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
