'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type QuickActionType = 'newClient' | 'newDeal' | 'newAppointment' | 'newQuote' | 'newEmail' | null

interface QuickActionsContextType {
    requestAction: QuickActionType
    clearAction: () => void
    requestNewClient: () => void
    requestNewDeal: () => void
    requestNewAppointment: () => void
    requestNewQuote: () => void
    requestNewEmail: () => void
}

const QuickActionsContext = createContext<QuickActionsContextType | null>(null)

export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [requestAction, setRequestAction] = useState<QuickActionType>(null)

    const clearAction = useCallback(() => setRequestAction(null), [])

    const requestNewClient = useCallback(() => {
        setRequestAction('newClient')
        router.push('/dashboard/clients')
    }, [router])

    const requestNewDeal = useCallback(() => {
        setRequestAction('newDeal')
        router.push('/dashboard/kanban')
    }, [router])

    const requestNewAppointment = useCallback(() => {
        setRequestAction('newAppointment')
        router.push('/dashboard/citas')
    }, [router])

    const requestNewQuote = useCallback(() => {
        setRequestAction('newQuote')
        router.push('/dashboard/quotes')
    }, [router])

    const requestNewEmail = useCallback(() => {
        setRequestAction('newEmail')
        router.push('/dashboard/mail')
    }, [router])

    return (
        <QuickActionsContext.Provider
            value={{
                requestAction,
                clearAction,
                requestNewClient,
                requestNewDeal,
                requestNewAppointment,
                requestNewQuote,
                requestNewEmail,
            }}
        >
            {children}
        </QuickActionsContext.Provider>
    )
}

export function useQuickActions() {
    const ctx = useContext(QuickActionsContext)
    if (!ctx) throw new Error('useQuickActions must be used within QuickActionsProvider')
    return ctx
}
