import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import { useUser } from '@/context/UserContext'
import { useServerSubscription } from '@/hooks/reactive/useServerSubscription'
import type { Client } from '@/types'
import { toast } from 'sonner'

interface ClientsContextType {
    clients: Client[]
    loading: boolean
    searchTerm: string
    setSearchTerm: (term: string) => void
    showMine: boolean
    setShowMine: (show: boolean) => void
    refreshClients: () => void
    fetchNextPage: () => void
    hasNextPage: boolean
    isFetchingNextPage: boolean
    createClient: (clientData: Partial<Client>) => Promise<Client>
    updateClient: (id: string, clientData: Partial<Client>) => Promise<Client>
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export function ClientsProvider({ children }: { children: React.ReactNode }) {
    const { clients: clientsApi } = useApi()
    const { profile } = useUser()
    const queryClient = useQueryClient()

    const [searchTerm, setSearchTerm] = useState('')
    const [showMine, setShowMine] = useState(false)

    // Realtime invalidation
    useServerSubscription('clients', [['clients', 'list']])

    // Use Infinite Query for clients with server-side filtering
    const {
        data,
        isLoading: loading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['clients', 'list', { searchTerm, showMine }],
        queryFn: ({ pageParam }) => clientsApi.getAll(searchTerm, showMine, pageParam as string | undefined, 50),
        getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
        initialPageParam: undefined,
        staleTime: 5000,
        enabled: !!profile,
    })

    const clients = useMemo(() => {
        return data?.pages.flatMap(page => (page as any).items) || []
    }, [data])

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
        clients,
        loading,
        searchTerm,
        setSearchTerm,
        showMine,
        setShowMine,
        refreshClients: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        createClient: (data: any) => createClientMutation.mutateAsync(data),
        updateClient: (id: string, data: Partial<Client>) => updateClientMutation.mutateAsync({ id, data }),
    }), [clients, loading, searchTerm, showMine, queryClient, createClientMutation, updateClientMutation, fetchNextPage, hasNextPage, isFetchingNextPage])

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
