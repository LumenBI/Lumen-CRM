'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useApi } from '@/hooks/useApi'
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
    const { appointments: appointmentsApi } = useApi()

    const fetchAppointments = useCallback(async () => {
        try {
            const data = await appointmentsApi.getAll()
            setAppointments(data)
        } catch (error) {
            console.error('Error fetching appointments:', error)
        } finally {
            setLoading(false)
        }
    }, [appointmentsApi])

    useEffect(() => {
        fetchAppointments()
    }, [fetchAppointments])

    const createAppointment = useCallback(async (appointment: Partial<Appointment>) => {
        try {
            await appointmentsApi.create(appointment)
            await fetchAppointments()
        } catch (error) {
            console.error('Error creating appointment:', error)
            throw error
        }
    }, [appointmentsApi, fetchAppointments])

    const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
        try {
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))

            await appointmentsApi.update(id, updates)
            fetchAppointments()
        } catch (error) {
            console.error('Error updating appointment:', error)
            fetchAppointments()
            throw error
        }
    }, [appointmentsApi, fetchAppointments])

    const deleteAppointment = useCallback(async (id: string) => {
        try {
            setAppointments(prev => prev.filter(a => a.id !== id))

            await appointmentsApi.delete(id)
        } catch (error) {
            console.error('Error deleting appointment:', error)
            fetchAppointments()
            throw error
        }
    }, [appointmentsApi, fetchAppointments])

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
