'use client'

import { useState, useEffect } from 'react'
import { LucideX } from 'lucide-react'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import { useClients } from '@/context/ClientsContext'
import ModalPortal from '@/components/ui/ModalPortal'

interface CreateAppointmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    preselectedClientId?: string
    initialData?: any // Add initial data for editing
}

export default function CreateAppointmentModal({
    isOpen,
    onClose,
    onSuccess,
    preselectedClientId,
    initialData
}: CreateAppointmentModalProps) {
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

    const { authFetch } = useAuthFetch()
    const { myClients } = useClients()

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                setFormData({
                    clientId: initialData.client?.id || '',
                    title: initialData.title || '',
                    description: initialData.description || '',
                    date: initialData.appointment_date || '',
                    time: initialData.appointment_time || '',
                    type: initialData.appointment_type || 'virtual',
                    meetingLink: initialData.meeting_link || '',
                    location: initialData.location || ''
                })
            } else {
                // Create Mode
                const today = new Date().toISOString().split('T')[0]
                setFormData({
                    clientId: preselectedClientId || '',
                    title: '',
                    description: '',
                    date: today,
                    time: '',
                    type: 'virtual',
                    meetingLink: '',
                    location: ''
                })
            }
        }
    }, [isOpen, preselectedClientId, initialData])

    const [recurrence, setRecurrence] = useState('none') // none, daily, weekly
    const [recurrenceCount, setRecurrenceCount] = useState(1)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const method = initialData ? 'PATCH' : 'POST'

            const createRequest = async (data: any) => {
                const url = initialData
                    ? `${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments/${initialData.id}`
                    : `${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments`

                const res = await authFetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })

                if (!res.ok) throw new Error('Failed to create appointment')
            }

            if (recurrence === 'none' || initialData) {
                // Normal single creation/update
                await createRequest(formData)
            } else {
                // Recurrence Creation (Loop)
                const baseDate = new Date(formData.date + 'T' + formData.time)
                // Use user-defined count
                const iterations = recurrenceCount

                const promises = []
                for (let i = 0; i < iterations; i++) {
                    const newDate = new Date(baseDate)
                    if (recurrence === 'daily') {
                        newDate.setDate(baseDate.getDate() + i)
                    } else if (recurrence === 'weekly') {
                        newDate.setDate(baseDate.getDate() + (i * 7))
                    }

                    const dateStr = newDate.toISOString().split('T')[0]
                    promises.push(createRequest({
                        ...formData,
                        date: dateStr
                    }))
                }
                await Promise.all(promises)
            }

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
        setRecurrence('none')
        setRecurrenceCount(1)
        onClose()
    }

    if (!isOpen) return null

    return (
        <ModalPortal>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-[#000d42]">{initialData ? 'Editar Cita' : 'Nueva Cita'}</h2>
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
                            {myClients.map((client) => (
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

                    {/* Recurrence (Create Mode Only) */}
                    {!initialData && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Repetir
                                </label>
                                <select
                                    value={recurrence}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setRecurrence(val);
                                        // Set defaults based on selection
                                        if (val === 'daily') setRecurrenceCount(5);
                                        else if (val === 'weekly') setRecurrenceCount(4);
                                        else setRecurrenceCount(1);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                                >
                                    <option value="none">No repetir</option>
                                    <option value="daily">Diariamente</option>
                                    <option value="weekly">Semanalmente</option>
                                </select>
                            </div>
                            {recurrence !== 'none' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Veces
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={recurrenceCount}
                                        onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                                    />
                                </div>
                            )}
                        </div>
                    )}

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
                            {loading ? 'Guardando...' : (initialData ? 'Actualizar Cita' : 'Agendar Cita')}
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    )
}
