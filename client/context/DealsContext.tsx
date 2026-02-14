'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createClient as createSupabaseClient } from '@/utils/supabase/client'
import { useData } from '@/context/DataContext'
import { useApi } from '@/hooks/useApi'
import type { Deal } from '@/types'
import { STAGES } from '@/constants/stages'

export type KanbanBoard = {
    [key: string]: Deal[]
}

// Re-export for backwards compatibility
export const KANBAN_COLUMNS = STAGES.map(s => ({ id: s.id, title: s.title }))

interface DealsContextType {
    board: KanbanBoard | null
    loading: boolean
    refreshBoard: () => Promise<void>
    moveDeal: (dealId: string, newStatus: Deal['status'], interactionData?: { interactionType: string, summary: string, nextStep?: string }) => Promise<void>
    updateBoard: (newBoard: KanbanBoard) => void
}

const DealsContext = createContext<DealsContextType | undefined>(undefined)

export function DealsProvider({ children }: { children: React.ReactNode }) {
    const [board, setBoard] = useState<KanbanBoard | null>(null)
    const [loading, setLoading] = useState(true)
    const { deals: bootstrapBoard, loading: dataLoading } = useData()

    const { deals: dealsApi, interactions: interactionsApi } = useApi()

    const fetchBoard = useCallback(async () => {
        try {
            console.log("Fetching Kanban Board from API...");
            const data: KanbanBoard = await dealsApi.getKanban()
            console.log("Kanban API Response:", data);

            const splitBoard = { ...data }

            if (splitBoard.CERRADO) {
                splitBoard.CERRADO_GANADO = splitBoard.CERRADO.filter((d: Deal) => d.status === 'CERRADO_GANADO')
                splitBoard.CERRADO_PERDIDO = splitBoard.CERRADO.filter((d: Deal) => d.status === 'CERRADO_PERDIDO')
                delete splitBoard.CERRADO
            }

            KANBAN_COLUMNS.forEach(col => {
                if (!splitBoard[col.id]) splitBoard[col.id] = []
            })

            console.log("Processed Board:", splitBoard);

            setBoard(splitBoard)
        } catch (error) {
            console.error("Error cargando kanban:", error)
        } finally {
            setLoading(false)
        }
    }, [dealsApi])

    const supabase = useMemo(() => createSupabaseClient(), [])

    useEffect(() => {
        const channel = supabase
            .channel('deals-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, (payload: any) => {
                // For simplicity in Kanban, since items can change stages, 
                // a full local board recalculation from payload is complex.
                // However, we can just trigger fetchBoard() which is specific to deals.
                // This is still much better than fetching the whole app bootstrap.
                fetchBoard()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, fetchBoard])

    // Bridge with DataContext
    useEffect(() => {
        if (bootstrapBoard) {
            console.log("Using Bootstrap Kanban Data:", bootstrapBoard);
            const splitBoard = { ...bootstrapBoard }
            // Handle splitting CERRADO if not already handled by backend
            if (splitBoard.CERRADO) {
                splitBoard.CERRADO_GANADO = splitBoard.CERRADO.filter((d: Deal) => d.status === 'CERRADO_GANADO')
                splitBoard.CERRADO_PERDIDO = splitBoard.CERRADO.filter((d: Deal) => d.status === 'CERRADO_PERDIDO')
                delete splitBoard.CERRADO
            }
            KANBAN_COLUMNS.forEach(col => {
                if (!splitBoard[col.id]) splitBoard[col.id] = []
            })
            setBoard(splitBoard)
            setLoading(false)
        } else if (!dataLoading) {
            console.log("No Bootstrap Data, calling fetchBoard directly");
            fetchBoard()
        }
    }, [bootstrapBoard, dataLoading, fetchBoard])

    const moveDeal = useCallback(async (dealId: string, newStatus: Deal['status'], interactionData?: { interactionType: string, summary: string, nextStep?: string }) => {
        if (!board) return

        const previousBoard = { ...board }

        const newBoard = { ...board }
        let movedDeal: Deal | undefined = undefined

        for (const colId in newBoard) {
            const index = newBoard[colId].findIndex((d: Deal) => d.id === dealId)
            if (index !== -1) {
                movedDeal = newBoard[colId][index]
                newBoard[colId] = [...newBoard[colId]]
                newBoard[colId].splice(index, 1)
                break
            }
        }

        if (!movedDeal) return

        movedDeal = { ...movedDeal, status: newStatus }
        if (!newBoard[newStatus]) newBoard[newStatus] = []
        else newBoard[newStatus] = [...newBoard[newStatus]]

        newBoard[newStatus].push(movedDeal)

        setBoard(newBoard)

        try {
            const promises: Promise<any>[] = []

            promises.push(dealsApi.move(dealId, newStatus))

            if (interactionData) {
                promises.push(interactionsApi.create({
                    clientId: movedDeal.client?.id || movedDeal.client_id!,
                    category: interactionData.interactionType,
                    summary: `[CAMBIO DE ETAPA: ${newStatus}] ${interactionData.summary}` + (interactionData.nextStep ? `\nPróximo paso: ${interactionData.nextStep}` : ''),
                    modality: 'VIRTUAL'
                }))
            }

            await Promise.all(promises)

        } catch (error) {
            console.error("Error executing move/log:", error)
            alert("Hubo un error al guardar los cambios. Revertiendo...")

            setBoard(previousBoard)
        }
    }, [board, dealsApi, interactionsApi])


    const updateBoard = useCallback((newBoard: KanbanBoard) => {
        setBoard(newBoard)
    }, [])

    const value = useMemo(() => ({
        board,
        loading,
        refreshBoard: fetchBoard,
        moveDeal,
        updateBoard
    }), [board, loading, fetchBoard, moveDeal, updateBoard])

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
