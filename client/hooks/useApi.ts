
import { useCallback, useMemo } from 'react'
import { useAuthFetch } from './useAuthFetch'
import { toast } from 'sonner'
import { ZodError } from 'zod'
import { ClientSchema, AppointmentSchema, DealSchema, InteractionSchema } from '@/lib/schemas'
import type { Client, Deal, Appointment, Interaction } from '@/types'
import type { Agent } from '@/context/AgentsContext'

export const useApi = () => {
    const { authFetch } = useAuthFetch()

    const api = useMemo(() => ({
        clients: {
            getAll: async (query: string = '', mine: boolean = false) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients?query=${query}&mine=${mine}`)
                if (!res.ok) throw new Error('Failed to fetch clients')
                return res.json() as Promise<Client[]>
            },

            getById: async (id: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients/${id}`)
                if (!res.ok) throw new Error('Failed to fetch client')
                return res.json() as Promise<{ client: Client, interactions: Interaction[], deals: Deal[] }>
            },

            create: async (data: Partial<Client>) => {
                try {
                    ClientSchema.parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to create client')
                    toast.success('Cliente creado exitosamente')
                    return res.json() as Promise<Client>
                } catch (error) {
                    if (error instanceof ZodError) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const message = (error as any).issues[0].message
                        toast.error(message)
                    } else {
                        toast.error('Error al crear cliente')
                    }
                    throw error
                }
            },

            update: async (id: string, data: Partial<Client>) => {
                try {
                    ClientSchema.partial().parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to update client')
                    toast.success('Cliente actualizado exitosamente')
                    return res.json() as Promise<Client>
                } catch (error) {
                    if (error instanceof ZodError) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const message = (error as any).issues[0].message
                        toast.error(message)
                    } else {
                        toast.error('Error al actualizar cliente')
                    }
                    throw error
                }
            },

            delete: async (id: string) => {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients/${id}`, {
                        method: 'DELETE'
                    })
                    if (!res.ok) throw new Error('Failed to delete client')
                    toast.success('Cliente eliminado exitosamente')
                    return res.json()
                } catch (error) {
                    toast.error('Error al eliminar cliente')
                    throw error
                }
            },

            move: async (id: string, status: string) => {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients/${id}/move`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    })
                    if (!res.ok) throw new Error('Failed to move client')
                    return res.json() as Promise<Client>
                } catch (error) {
                    toast.error('Error al mover cliente')
                    throw error
                }
            },
        },

        users: {
            getAll: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
                if (!res.ok) throw new Error('Failed to fetch users')
                return res.json() as Promise<Agent[]>
            },

            toggleStatus: async (id: string, currentStatus: boolean) => {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isActive: !currentStatus })
                    })
                    if (!res.ok) throw new Error('Failed to update user status')
                    toast.success('Estado de usuario actualizado')
                    return res.json()
                } catch (error) {
                    toast.error('Error al actualizar estado de usuario')
                    throw error
                }
            }
        },

        deals: {
            getKanban: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/kanban`)
                if (!res.ok) throw new Error('Failed to fetch kanban')
                return res.json()
            },

            create: async (data: any) => {
                try {
                    DealSchema.parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/deals`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to create deal')
                    toast.success('Oportunidad creada exitosamente')
                    return res.json() as Promise<Deal>
                } catch (error) {
                    if (error instanceof ZodError) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const message = (error as any).issues[0].message
                        toast.error(message)
                    } else {
                        toast.error('Error al crear oportunidad')
                    }
                    throw error
                }
            },

            move: async (id: string, status: string) => {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/deals/${id}/move`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    })
                    if (!res.ok) throw new Error('Failed to move deal')
                    return res.json() as Promise<Deal>
                } catch (error) {
                    toast.error('Error al mover oportunidad')
                    throw error
                }
            },
            update: async (id: string, data: Partial<Deal>) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/deals/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                if (!res.ok) throw new Error('Failed to update deal')
                toast.success('Cambios guardados')
                return res.json() as Promise<Deal>
            },
        },

        appointments: {
            getAll: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments`)
                if (!res.ok) throw new Error('Failed to fetch appointments')
                return res.json() as Promise<Appointment[]>
            },

            create: async (data: Partial<Appointment>) => {
                try {
                    AppointmentSchema.partial().parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to create appointment')
                    toast.success('Cita agendada exitosamente')
                    return res.json() as Promise<Appointment>
                } catch (error) {
                    if (error instanceof ZodError) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const message = (error as any).issues[0].message
                        toast.error(message)
                    } else {
                        toast.error('Error al agendar cita')
                    }
                    throw error
                }
            },

            update: async (id: string, data: Partial<Appointment>) => {
                try {
                    AppointmentSchema.partial().parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to update appointment')
                    toast.success('Cita actualizada exitosamente')
                    return res.json() as Promise<Appointment>
                } catch (error) {
                    if (error instanceof ZodError) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const message = (error as any).issues[0].message
                        toast.error(message)
                    } else {
                        toast.error('Error al actualizar cita')
                    }
                    throw error
                }
            },

            delete: async (id: string) => {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments/${id}`, {
                        method: 'DELETE'
                    })
                    if (!res.ok) throw new Error('Failed to delete appointment')
                    toast.success('Cita eliminada exitosamente')
                    return res.json()
                } catch (error) {
                    toast.error('Error al eliminar cita')
                    throw error
                }
            },
        },

        interactions: {
            create: async (data: any) => {
                try {
                    InteractionSchema.parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/interactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to create interaction')
                    return res.json() as Promise<Interaction>
                } catch (error) {
                    if (error instanceof ZodError) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const message = (error as any).issues[0].message
                        toast.error(message)
                    } else {
                        toast.error('Error al registrar interacción')
                    }
                    throw error
                }
            },
        },

        history: {
            get: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/history`)
                if (!res.ok) throw new Error('Failed to fetch history')
                return res.json()
            },
        },

        activities: {
            get: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/activities`)
                if (!res.ok) throw new Error('Failed to fetch activities')
                return res.json()
            },
        },

        stats: {
            get: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`)
                if (!res.ok) throw new Error('Failed to fetch stats')
                return res.json()
            },
        },
        bootstrap: {
            get: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/bootstrap`)
                if (!res.ok) throw new Error('Failed to fetch bootstrap data')
                return res.json()
            }
        }
    }), [authFetch])

    return api
}
