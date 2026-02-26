
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
            getAll: async (query: string = '', mine: boolean = false, cursor?: string, limit: number = 50) => {
                let url = `${process.env.NEXT_PUBLIC_API_URL}/clients/list?query=${query}&mine=${mine}&limit=${limit}`;
                if (cursor) url += `&cursor=${cursor}`;
                const res = await authFetch(url, {
                    cache: 'no-store'
                })
                if (!res.ok) {
                    toast.error('Error al obtener clientes')
                    throw new Error('Failed to fetch clients')
                }
                return res.json()
            },

            getById: async (id: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`)
                if (!res.ok) throw new Error('Failed to fetch client')
                return res.json() as Promise<{ client: Client, interactions: Interaction[], deals: Deal[] }>
            },

            create: async (data: Partial<Client>) => {
                try {
                    ClientSchema.parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to create client')
                    toast.success('Cliente creado exitosamente')
                    return res.json() as Promise<Client>
                } catch (error) {
                    if (error instanceof ZodError) {
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

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to update client')
                    toast.success('Cliente actualizado exitosamente')
                    return res.json() as Promise<Client>
                } catch (error) {
                    if (error instanceof ZodError) {
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
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
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
            },

            updateNotificationInterval: async (minutes: number) => {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/interval?minutes=${minutes}`, {
                        method: 'PATCH'
                    })
                    if (!res.ok) throw new Error('Failed to update notification settings')
                    return res.json()
                } catch (error) {
                    console.error('Error updating notification interval:', error)
                    throw error
                }
            },
            updatePreferences: async (preferences: any) => {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(preferences)
                    })
                    if (!res.ok) throw new Error('Failed to update preferences')
                    return res.json()
                } catch (error) {
                    console.error('Error updating preferences:', error)
                    throw error
                }
            }
        },

        deals: {
            getColumna: async (columnId: string, cursor?: string | number, limit: number = 20, agentId?: string) => {
                let url = `${process.env.NEXT_PUBLIC_API_URL}/deals/column?columnId=${columnId}&limit=${limit}`;

                if (cursor !== undefined && cursor !== null) {
                    url += `&cursor=${cursor}`;
                }

                if (agentId && agentId !== 'ALL') {
                    url += `&agentId=${agentId}`;
                }

                const res = await authFetch(url, {
                    cache: 'no-store'
                })
                if (!res.ok) {
                    toast.error('Error al obtener Kanban')
                    throw new Error('Failed to fetch kanban column')
                }
                return res.json()
            },

            create: async (data: any) => {
                try {
                    DealSchema.partial().parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/deals`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to create deal')
                    return res.json() as Promise<Deal>
                } catch (error) {
                    if (error instanceof ZodError) {
                        const message = (error as any).issues[0].message
                        toast.error(message)
                    }
                    throw error
                }
            },

            move: async (id: string, status: string) => {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/deals/${id}/move`, {
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
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/deals/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                if (!res.ok) throw new Error('Failed to update deal')
                toast.success('Cambios guardados')
                return res.json() as Promise<Deal>
            },

            delete: async (id: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/deals/${id}`, {
                    method: 'DELETE'
                })
                if (!res.ok) throw new Error('Failed to delete deal')
                return res.json()
            },

            getAll: async (clientId?: string) => {
                let url = `${process.env.NEXT_PUBLIC_API_URL}/deals`
                if (clientId) url += `?clientId=${clientId}`

                const res = await authFetch(url, {
                    cache: 'no-store'
                })
                if (!res.ok) throw new Error('Failed to fetch deals')
                return res.json() as Promise<Deal[]>
            },
        },

        appointments: {
            getAll: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`, { cache: 'no-store' })
                if (!res.ok) {
                    toast.error('Error al obtener citas')
                    throw new Error('Failed to fetch appointments')
                }
                return res.json() as Promise<Appointment[]>
            },

            create: async (data: Partial<Appointment>) => {
                try {
                    AppointmentSchema.partial().parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to create appointment')
                    toast.success('Cita agendada exitosamente')
                    return res.json() as Promise<Appointment>
                } catch (error) {
                    if (error instanceof ZodError) {
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

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to update appointment')
                    toast.success('Cita actualizada exitosamente')
                    return res.json() as Promise<Appointment>
                } catch (error) {
                    if (error instanceof ZodError) {
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
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${id}`, {
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

            updateStatus: async (id: string, status: string) => {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    })
                    if (!res.ok) throw new Error('Failed to update appointment status')
                    toast.success('Estado de cita actualizado')
                    return res.json() as Promise<Appointment>
                } catch (error) {
                    toast.error('Error al actualizar estado de cita')
                    throw error
                }
            },
        },

        interactions: {
            create: async (data: any) => {
                try {
                    InteractionSchema.parse(data)

                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/interactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    if (!res.ok) throw new Error('Failed to create interaction')
                    return res.json() as Promise<Interaction>
                } catch (error) {
                    if (error instanceof ZodError) {
                        const message = (error as any).issues[0].message
                        toast.error(message)
                    } else {
                        toast.error('Error al registrar interacción')
                    }
                    throw error
                }
            },
        },

        stats: {
            get: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`)
                if (!res.ok) throw new Error('Failed to fetch stats')
                return res.json()
            },
        },
        bootstrap: {
            get: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`)
                if (!res.ok) throw new Error('Failed to fetch bootstrap data')
                return res.json()
            },
        },
        notifications: {
            check: async () => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/check`, {
                    cache: 'no-store'
                })
                if (!res.ok) throw new Error('Failed to check notifications')
                return res.json()
            }
        },

        quotes: {
            create: async (data: any) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                if (!res.ok) throw new Error('Failed to create quote')
                toast.success('Cotización creada')
                return res.json()
            },
            getByDeal: async (dealId: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes/deal/${dealId}`)
                if (!res.ok) throw new Error('Failed to fetch quotes')
                return res.json()
            },
            getById: async (id: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes/${id}`)
                if (!res.ok) throw new Error('Failed to fetch quote')
                return res.json()
            },
            getProducts: async (search: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes/products?search=${search}`)
                if (!res.ok) throw new Error('Failed to fetch products')
                return res.json()
            },
            updateStatus: async (id: string, status: string, pdfUrl?: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status, pdfUrl })
                })
                if (!res.ok) throw new Error('Failed to update quote status')
                return res.json()
            }
        },

        ai: {
            smartDraft: async (data: {
                company_name: string;
                items: { description: string }[];
                contact_person?: string;
                notes?: string;
                quote_number?: string;
                currency?: string;
                valid_until?: string;
                total_amount?: number;
            }) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/smart-draft`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error('Failed to generate draft')
                const json = await res.json()
                return json.draft as string
            }
        },

        mail: {
            sendQuote: async (data: { to: string; subject: string; message: string; pdfBase64: string; filename: string }) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/mail/send-quote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                if (!res.ok) throw new Error('Failed to send email')
                toast.success('Correo enviado')
                return res.json()
            },
            getInbox: async (pageToken?: string, maxResults: number = 50) => {
                const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/mail/inbox`)
                if (pageToken) url.searchParams.append('pageToken', pageToken)
                url.searchParams.append('maxResults', maxResults.toString())

                const res = await authFetch(url.toString())

                if (!res.ok) {
                    if (res.status === 401) {
                        throw new Error('401 Unauthorized')
                    }
                    const errorBody = await res.json().catch(() => ({}))
                    throw new Error(errorBody.message || 'Failed to fetch inbox')
                }
                return res.json()
            },
            getThreads: async (email: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/mail/threads/${email}`)
                if (!res.ok) throw new Error('Failed to fetch threads')
                return res.json()
            },

            send: async (data: {
                to: string;
                subject: string;
                message: string;
                threadId?: string;
                inReplyTo?: string;
                references?: string;
            }) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/mail/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                })
                if (!res.ok) throw new Error('Failed to send email')
                toast.success('Correo enviado')
                return res.json()
            },
            getMessage: async (id: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/mail/message/${id}`)
                if (!res.ok) throw new Error('Failed to fetch message details')
                return res.json()
            },
            getAttachment: async (messageId: string, attachmentId: string) => {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/mail/attachment/${messageId}/${attachmentId}`)
                if (!res.ok) throw new Error('Failed to fetch attachment')
                return res.json()
            }
        }
    }), [authFetch])

    return api
}
