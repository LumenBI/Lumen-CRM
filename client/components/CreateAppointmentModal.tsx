'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LucideX } from 'lucide-react'

interface Client {
    id: string
    company_name: string
    contact_name: string
}

interface CreateAppointmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    preselectedClientId?: string
}

export default function CreateAppointmentModal({
    isOpen,
    onClose,
    onSuccess,
    preselectedClientId
}: CreateAppointmentModalProps) {
    const [clients, setClients] = useState<Client[]>([])
    const [formData, setFormData] = useState({
        clientId: preselectedClientId || '',
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'virtual',
        meetingLink: '',
        location: ''
    })
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            fetchClients()
            // Set default date to today
            const today = new Date().toISOString().split('T')[0]
            setFormData(prev => ({ ...prev, date: today }))

            if (preselectedClientId) {
                setFormData(prev => ({ ...prev, clientId: preselectedClientId }))
            }
        }
    }, [isOpen, preselectedClientId])

    async function fetchClients() {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const token = session.access_token
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/kanban`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) return

            const kanbanData = await res.json()
            const allClients: Client[] = []

            // Flatten all clients from kanban columns
            Object.values(kanbanData).forEach((column: any) => {
                if (Array.isArray(column)) {
                    allClients.push(...column)
                }
            })

            setClients(allClients)
        } catch (error) {
            console.error('Error fetching clients:', error)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const token = session.access_token
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Failed to create appointment')

            onSuccess()
            handleClose()
        } catch (error) {
            console.error('Error creating appointment:', error)
            alert('Error al crear la cita. Por favor intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    function handleClose() {
        setFormData({
            clientId: '',
            title: '',
            description: '',
            date: '',
            time: '',
            type: 'virtual',
            meetingLink: '',
            location: ''
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-[#000d42]">Nueva Cita</h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 transition"
                    >
                        <LucideX className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Client Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Cliente *
                        </label>
                        <select
                            required
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.company_name} - {client.contact_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Título *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ej: Reunión de seguimiento"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Hora *
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tipo de Reunión *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                        >
                            <option value="virtual">Virtual (Zoom/Meet/Teams)</option>
                            <option value="presencial">Presencial</option>
                            <option value="llamada">Llamada Telefónica</option>
                        </select>
                    </div>

                    {/* Meeting Link (only for virtual) */}
                    {formData.type === 'virtual' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Link de Reunión
                            </label>
                            <input
                                type="url"
                                value={formData.meetingLink}
                                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                placeholder="https://zoom.us/j/..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                            />
                        </div>
                    )}

                    {/* Location (only for presencial) */}
                    {formData.type === 'presencial' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Ubicación
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Dirección de la reunión"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Descripción / Agenda
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Temas a tratar..."
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-[#0056fc] text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : 'Agendar Cita'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
