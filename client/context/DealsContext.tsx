import React, { createContext, useContext, useMemo, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import { useServerSubscription } from '@/hooks/reactive/useServerSubscription'
import { toast } from 'sonner'
import type { Deal } from '@/types'

export const KANBAN_COLUMNS = [
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

    // Global realtime subscription
    useServerSubscription('deals', [['deals']])

    const moveDealMutation = useMutation({
        mutationFn: async ({ dealId, newStatus, interactionData }: {
            dealId: string,
            newStatus: Deal['status'],
            interactionData?: any
        }) => {
            const promises: Promise<any>[] = [dealsApi.move(dealId, newStatus)];

            if (interactionData?.clientId) {
                promises.push(interactionsApi.create({
                    clientId: interactionData.clientId,
                    category: interactionData.interactionType || 'SEGUIMIENTO',
                    summary: `[CAMBIO DE ETAPA: ${newStatus}] ${interactionData.summary || ''}` +
                        (interactionData.nextStep ? `\nPróximo paso: ${interactionData.nextStep}` : ''),
                    modality: 'VIRTUAL'
                }));
            }

            return Promise.all(promises);
        },
        onSuccess: () => {
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

    const value = useMemo(() => ({
        refreshBoard: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
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
