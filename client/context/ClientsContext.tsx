import { createContext, useContext, useMemo, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import { useUser } from '@/context/UserContext'
import { useServerSubscription } from '@/hooks/reactive/useServerSubscription'
import type { Client } from '@/types'
import { toast } from 'sonner'

interface ClientsContextType {
    allClients: Client[]
    myClients: Client[]
    searchClients: (query: string) => Client[]
    searchAllClients: (query: string) => Client[]
    refreshClients: () => void
    createClient: (clientData: Partial<Client>) => Promise<Client>
    updateClient: (id: string, clientData: Partial<Client>) => Promise<Client>
    loading: boolean
    fetchNextPage: () => void
    hasNextPage: boolean
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export function ClientsProvider({ children }: { children: React.ReactNode }) {
    const { clients: clientsApi } = useApi()
    const { profile } = useUser()
    const queryClient = useQueryClient()

    // Realtime invalidation
    useServerSubscription('clients', [['clients', 'list']])

    // Use Infinite Query for clients
    const {
        data,
        isLoading: loading,
        fetchNextPage,
        hasNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['clients', 'list'],
        queryFn: ({ pageParam }) => clientsApi.getAll('', false, pageParam as string, 50),
        getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
        initialPageParam: undefined,
        staleTime: 0,
    })

    const allClients = useMemo(() => {
        return data?.pages.flatMap(page => (page as any).items) || []
    }, [data])

    const myClients = useMemo(() => {
        if (!profile) return []
        if (['ADMIN', 'MANAGER'].includes(profile.role?.toUpperCase())) {
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

    const createClientMutation = useMutation({
        mutationFn: (clientData: Partial<Client>) => clientsApi.create(clientData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
        }
    })

    const updateClientMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Client> }) => clientsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
        }
    })

    const value = useMemo(() => ({
        allClients,
        myClients,
        searchClients,
        searchAllClients,
        refreshClients: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
        createClient: createClientMutation.mutateAsync,
        updateClient: (id: string, data: Partial<Client>) => updateClientMutation.mutateAsync({ id, data }),
        loading,
        fetchNextPage,
        hasNextPage
    }), [allClients, myClients, searchClients, searchAllClients, queryClient, createClientMutation, updateClientMutation, loading, fetchNextPage, hasNextPage])

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
