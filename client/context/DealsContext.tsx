'use client'

import { createContext, useContext, useCallback, useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import { useServerSubscription } from '@/hooks/reactive/useServerSubscription'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import type { Deal } from '@/types'
import { STAGES } from '@/constants/stages'
import { toast } from 'sonner'

export type KanbanBoard = {
    [key: string]: Deal[]
}

export const KANBAN_COLUMNS = STAGES.map(s => ({ id: s.id, title: s.title }))

interface DealsContextType {
    board: KanbanBoard
    loading: boolean
    refreshBoard: () => void
    moveDeal: (dealId: string, newStatus: Deal['status'], interactionData?: { interactionType: string, summary: string, nextStep?: string, clientId: string }) => Promise<void>
    updateBoard: (newBoard: KanbanBoard) => void
    // fetchNextPage: (columnId: string) => void // Temporarily removed as per instruction focus
    // hasNextPage: (columnId: string) => boolean // Temporarily removed as per instruction focus
}

const DealsContext = createContext<DealsContextType | undefined>(undefined)

export function DealsProvider({ children }: { children: React.ReactNode }) {
    const { deals: dealsApi, interactions: interactionsApi } = useApi()
    const queryClient = useQueryClient()

    // Realtime invalidation - when anything in 'deals' changes, 
    // we invalidate all deal-related queries
    useServerSubscription('deals', [['deals']])

    // For the Kanban board, we'll fetch the initial view of all columns.
    // To maintain the 'board' object interface for the existing KanbanPage.
    const { data: boardData, isLoading: loading } = useQuery({
        queryKey: ['deals', 'board'],
        queryFn: async () => {
            // We'll fetch all columns concurrently for the initial board
            const results = await Promise.all(
                KANBAN_COLUMNS.map(col => dealsApi.getColumna(col.id, undefined, 50))
            );

            const board: KanbanBoard = {};
            results.forEach((res, index) => {
                board[KANBAN_COLUMNS[index].id] = res.items;
            });
            return board;
        },
        staleTime: 0,
    });

    const board = useMemo(() => boardData || {}, [boardData]);

    const moveDealMutation = useMutation({
        mutationFn: async ({ dealId, newStatus, interactionData }: {
            dealId: string,
            newStatus: Deal['status'],
            interactionData?: any
        }) => {
            const promises: Promise<any>[] = [dealsApi.move(dealId, newStatus)];

            if (interactionData?.clientId) {
                promises.push(interactionsApi.create({
                    clientId: interactionData.clientId, // Should be passed in
                    category: interactionData.interactionType,
                    summary: `[CAMBIO DE ETAPA: ${newStatus}] ${interactionData.summary}` +
                        (interactionData.nextStep ? `\nPróximo paso: ${interactionData.nextStep}` : ''),
                    modality: 'VIRTUAL'
                }));
            }

            return Promise.all(promises);
        },
        onSuccess: () => {
            // Invalidate all deal queries for fresh data
            queryClient.invalidateQueries({ queryKey: ['deals'] });
        }
    });

    const moveDeal = useCallback(async (
        dealId: string,
        newStatus: Deal['status'],
        interactionData?: any
    ) => {
        await moveDealMutation.mutateAsync({ dealId, newStatus, interactionData });
    }, [moveDealMutation]);

    const updateBoard = useCallback((newBoard: KanbanBoard) => {
        // Optimistic update - manual cache modification
        queryClient.setQueryData(['deals', 'board'], newBoard);
    }, [queryClient]);

    const value = useMemo(() => ({
        board,
        loading,
        refreshBoard: () => queryClient.invalidateQueries({ queryKey: ['deals', 'board'] }),
        moveDeal,
        updateBoard
    }), [board, loading, moveDeal, updateBoard, queryClient]);

    return (
        <DealsContext.Provider value={value}>
            {children}
        </DealsContext.Provider>
    )
}

export function useDeals() {
    const context = useContext(DealsContext)
    if (context === undefined) {
        throw new Error('useDeals must be used within a DealsProvider')
    }
    return context
}
