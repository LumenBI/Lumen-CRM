'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import type { Appointment } from '@/types'

interface AppointmentsContextType {
    appointments: Appointment[]
    loading: boolean
    refreshAppointments: () => Promise<void>
    createAppointment: (appointment: Partial<Appointment>) => Promise<void>
    updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>
    deleteAppointment: (id: string) => Promise<void>
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined)

export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const { authFetch } = useAuthFetch()

    const fetchAppointments = useCallback(async () => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments`)
            if (res.ok) {
                const data = await res.json()
                setAppointments(data)
            }
        } catch (error) {
            console.error('Error fetching appointments:', error)
        } finally {
            setLoading(false)
        }
    }, [authFetch])

    useEffect(() => {
        fetchAppointments()
    }, [fetchAppointments])

    const createAppointment = useCallback(async (appointment: Partial<Appointment>) => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointment)
            })
            if (!res.ok) throw new Error('Failed to create appointment')
            await fetchAppointments()
        } catch (error) {
            console.error('Error creating appointment:', error)
            throw error
        }
    }, [authFetch, fetchAppointments])

    const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
        try {
            // Optimistic update
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))

            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (!res.ok) {
                throw new Error('Failed to update appointment')
                // Revert on error would go here if strict
            }
            // Background refresh to ensure consistency
            fetchAppointments()
        } catch (error) {
            console.error('Error updating appointment:', error)
            fetchAppointments() // Revert state on error
            throw error
        }
    }, [authFetch, fetchAppointments])

    const deleteAppointment = useCallback(async (id: string) => {
        try {
            // Optimistic update
            setAppointments(prev => prev.filter(a => a.id !== id))

            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete appointment')
        } catch (error) {
            console.error('Error deleting appointment:', error)
            fetchAppointments() // Revert state on error
            throw error
        }
    }, [authFetch, fetchAppointments])

    const value = useMemo(() => ({
        appointments,
        loading,
        refreshAppointments: fetchAppointments,
        createAppointment,
        updateAppointment,
        deleteAppointment
    }), [appointments, loading, fetchAppointments, createAppointment, updateAppointment, deleteAppointment])

    return (
        <AppointmentsContext.Provider value={value}>
            {children}
        </AppointmentsContext.Provider>
    )
}

export function useAppointments() {
    const context = useContext(AppointmentsContext)
    if (context === undefined) {
        throw new Error('useAppointments must be used within an AppointmentsProvider')
    }
    return context
}
