import React, { createContext, useContext, useMemo, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import { useServerSubscription } from '@/hooks/reactive/useServerSubscription'
import { toast } from 'sonner'
import type { Deal } from '@/types'

export const KANBAN_COLUMNS = [
    { id: 'PENDING', title: 'No contactado' },
    { id: 'CONTACTADO', title: 'Contactado' },
    { id: 'CITA', title: 'Cita / Reunión' },
    { id: 'PROCESO_COTIZACION', title: 'Cotizando' },
    { id: 'COTIZACION_ENVIADA', title: 'Cotización Enviada' },
    { id: 'CERRADO_GANADO', title: 'Cerrado' },
    { id: 'CERRADO_PERDIDO', title: 'Perdido' }
] as const

interface DealsContextType {
    refreshBoard: () => void
    moveDeal: (dealId: string, newStatus: Deal['status'], interactionData?: any) => Promise<void>
}

const DealsContext = createContext<DealsContextType | undefined>(undefined)

export function DealsProvider({ children }: { children: React.ReactNode }) {
    const { deals: dealsApi, interactions: interactionsApi } = useApi()
    const queryClient = useQueryClient()

    // Global realtime subscription for both list and kanban views
    useServerSubscription('deals', [['deals'], ['kanban-column']])

    const moveDealMutation = useMutation({
        mutationFn: async ({ dealId, newStatus, interactionData }: {
            dealId: string,
            newStatus: Deal['status'],
            interactionData?: any
        }) => {
            const promises: Promise<any>[] = [dealsApi.move(dealId, newStatus)];

            if (interactionData?.clientId) {
                const stageTitle = KANBAN_COLUMNS.find(c => c.id === newStatus)?.title || newStatus;
                promises.push(interactionsApi.create({
                    clientId: interactionData.clientId,
                    category: interactionData.interactionType || 'SEGUIMIENTO',
                    summary: `Actualización de etapa: ${stageTitle}. ${interactionData.summary || ''}` +
                        (interactionData.nextStep ? `\nPróximo paso: ${interactionData.nextStep}` : ''),
                    modality: 'VIRTUAL'
                }));
            }

            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
            queryClient.invalidateQueries({ queryKey: ['kanban-column'] });
        }
    });

    const moveDeal = useCallback(async (
        dealId: string,
        newStatus: Deal['status'],
        interactionData?: any
    ) => {
        await moveDealMutation.mutateAsync({ dealId, newStatus, interactionData });
    }, [moveDealMutation]);

    const value = useMemo(() => ({
        refreshBoard: () => {
            queryClient.invalidateQueries({ queryKey: ['deals'] })
            queryClient.invalidateQueries({ queryKey: ['kanban-column'] })
        },
        moveDeal
    }), [moveDeal, queryClient]);

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
