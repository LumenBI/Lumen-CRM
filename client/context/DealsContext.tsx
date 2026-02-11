'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import type { Deal } from '@/types' // We might need to move Deal type to global types if not already

// Duplicate of types used in kanban page, should be centralized in types/index.ts
// adapting based on kanban/page.tsx
export type KanbanBoard = {
    [key: string]: Deal[]
}

export const KANBAN_COLUMNS = [
    { id: 'CONTACTADO', title: 'Contactado' },
    { id: 'CITA', title: 'Cita / Reunión' },
    { id: 'PROCESO_COTIZACION', title: 'Cotizando' },
    { id: 'COTIZACION_ENVIADA', title: 'Cot. Enviada' },
    { id: 'CERRADO_GANADO', title: 'Ganado' },
    { id: 'CERRADO_PERDIDO', title: 'Perdido' },
]

interface DealsContextType {
    board: KanbanBoard | null
    loading: boolean
    refreshBoard: () => Promise<void>
    moveDeal: (dealId: string, newStatus: string, interactionData?: { interactionType: string, summary: string, nextStep?: string }) => Promise<void>
}

const DealsContext = createContext<DealsContextType | undefined>(undefined)

export function DealsProvider({ children }: { children: React.ReactNode }) {
    const [board, setBoard] = useState<KanbanBoard | null>(null)
    const [loading, setLoading] = useState(true)
    const { authFetch } = useAuthFetch()

    const fetchBoard = useCallback(async () => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/kanban`)
            if (res.ok) {
                const data = await res.json()
                const splitBoard = { ...data }

                if (splitBoard.CERRADO) {
                    splitBoard.CERRADO_GANADO = splitBoard.CERRADO.filter((d: Deal) => d.status === 'CERRADO_GANADO')
                    splitBoard.CERRADO_PERDIDO = splitBoard.CERRADO.filter((d: Deal) => d.status === 'CERRADO_PERDIDO')
                    delete splitBoard.CERRADO
                }

                KANBAN_COLUMNS.forEach(col => {
                    if (!splitBoard[col.id]) splitBoard[col.id] = []
                })

                setBoard(splitBoard)
            }
        } catch (error) {
            console.error("Error cargando kanban:", error)
        } finally {
            setLoading(false)
        }
    }, [authFetch])

    useEffect(() => {
        fetchBoard()
    }, [fetchBoard])

    const moveDeal = useCallback(async (dealId: string, newStatus: string, interactionData?: { interactionType: string, summary: string, nextStep?: string }) => {
        if (!board) return

        // Optimistic Update
        const newBoard = { ...board }
        let movedDeal: Deal | undefined
        let sourceColumnId = ''

        // Find and remove from source
        for (const colId in newBoard) {
            const index = newBoard[colId].findIndex(d => d.id === dealId)
            if (index !== -1) {
                movedDeal = newBoard[colId][index]
                newBoard[colId].splice(index, 1)
                sourceColumnId = colId
                break
            }
        }

        if (!movedDeal) return

        // Add to dest
        movedDeal.status = newStatus
        if (!newBoard[newStatus]) newBoard[newStatus] = []
        newBoard[newStatus].push(movedDeal) // Adding to end for simplicity in context, UI might handle drag index

        setBoard(newBoard)

        try {
            const promises = []

            promises.push(authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/deals/${dealId}/move`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            }))

            if (interactionData) {
                promises.push(authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/interactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId: movedDeal.client.id,
                        category: interactionData.interactionType,
                        summary: `[CAMBIO DE ETAPA: ${newStatus}] ${interactionData.summary}` + (interactionData.nextStep ? `\nPróximo paso: ${interactionData.nextStep}` : ''),
                        modality: null
                    })
                }))
            }

            await Promise.all(promises)
        } catch (error) {
            console.error("Error executing move/log:", error)
            alert("Hubo un error al guardar los cambios.")
            fetchBoard() // Revert
        }
    }, [board, authFetch, fetchBoard])


    const value = useMemo(() => ({
        board,
        loading,
        refreshBoard: fetchBoard,
        moveDeal
    }), [board, loading, fetchBoard, moveDeal])

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
