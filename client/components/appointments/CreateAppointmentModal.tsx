'use client'

import { useState, useEffect } from 'react'
import { LucideX } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { useClients } from '@/context/ClientsContext'
import { useAgents } from '@/context/AgentsContext'
import { useUser } from '@/context/UserContext'
import ModalPortal from '@/components/ui/ModalPortal'
import { APPOINTMENT_TYPES } from '@/constants/appointments'
import { toast } from 'sonner'

interface CreateAppointmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    preselectedClientId?: string
    initialData?: any
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
        location: '',
    })
    const [participants, setParticipants] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showResults, setShowResults] = useState(false)

    const { appointments: appointmentsApi } = useApi()
    const { myClients } = useClients()
    const { agents } = useAgents()
    const { profile } = useUser()

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    clientId: initialData.client?.id || '',
                    title: initialData.title || '',
                    description: initialData.description || '',
                    date: initialData.appointment_date || '',
                    time: initialData.appointment_time || '',
                    type: initialData.appointment_type || 'virtual',
                    meetingLink: initialData.meeting_link || '',
                    location: initialData.location || '',
                })
                // Participants from backend relation
                if (initialData.participants) {
                    setParticipants(initialData.participants.map((p: any) => p.user || p))
                }
            } else {
                const today = new Date().toISOString().split('T')[0]
                setFormData({
                    clientId: preselectedClientId || '',
                    title: '',
                    description: '',
                    date: today,
                    time: '',
                    type: 'virtual',
                    meetingLink: '',
                    location: '',
                })
                // Add current user by default
                if (profile) {
                    setParticipants([profile])
                }
            }
        }
    }, [isOpen, preselectedClientId, initialData, profile])

    const [recurrence, setRecurrence] = useState('none')
    const [recurrenceCount, setRecurrenceCount] = useState(1)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        // Map form field names to standardized DB column names
        const payload = {
            client_id: formData.clientId,
            title: formData.title,
            description: formData.description,
            appointment_date: formData.date,
            appointment_time: formData.time,
            appointment_type: formData.type as 'virtual' | 'presencial' | 'llamada',
            meeting_link: formData.meetingLink,
            location: formData.location,
            participants: participants.map(p => p.id),
        }

        try {
            if (initialData) {
                await appointmentsApi.update(initialData.id, payload)
            } else {
                if (recurrence === 'none') {
                    await appointmentsApi.create(payload as any)
                } else {
                    const baseDate = new Date(formData.date + 'T' + formData.time)
                    const promises = []

                    for (let i = 0; i < recurrenceCount; i++) {
                        const nextDate = new Date(baseDate)
                        if (recurrence === 'daily') {
                            nextDate.setDate(baseDate.getDate() + i)
                        } else if (recurrence === 'weekly') {
                            nextDate.setDate(baseDate.getDate() + (i * 7))
                        }

                        const dateStr = nextDate.toISOString().split('T')[0]

                        promises.push(appointmentsApi.create({
                            ...payload,
                            appointment_date: dateStr
                        } as any))
                    }

                    await Promise.all(promises)
                }
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving appointment:', error)
            toast.error('Error al guardar la cita.')
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
            location: '',
        })
        setRecurrence('none')
        setRecurrenceCount(1)
        onClose()
    }

    if (!isOpen) return null

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{initialData ? 'Editar cita' : 'Nueva cita'}</h2>
                        <button
                            onClick={handleClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                        >
                            <LucideX className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Cliente *
                            </label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900/30 transition-all"
                            >
                                <option value="">Seleccionar cliente...</option>
                                {myClients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.company_name} - {client.contact_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Título *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej: Reunión de seguimiento"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900/30 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Fecha *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900/30 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Hora *
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900/30 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tipo de Reunión *
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900/30 transition-all"
                            >
                                {APPOINTMENT_TYPES.map((type) => (
                                    <option key={type.id} value={type.id}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Participantes
                            </label>

                            {/* Selected Participants Chips */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {participants.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700"
                                    >
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.full_name}</span>
                                        {p.id !== profile?.id && (
                                            <button
                                                type="button"
                                                onClick={() => setParticipants(participants.filter(item => item.id !== p.id))}
                                                className="text-slate-400 hover:text-red-500 transition"
                                            >
                                                <LucideX className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setShowResults(true)
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder="Añadir participante por nombre o email..."
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900/30 transition-all"
                                />

                                {showResults && searchTerm && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {agents
                                            .filter(agent =>
                                                !participants.some(p => p.id === agent.id) &&
                                                (agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    agent.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                            )
                                            .map((agent) => (
                                                <button
                                                    key={agent.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setParticipants([...participants, agent])
                                                        setSearchTerm('')
                                                        setShowResults(false)
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex flex-col"
                                                >
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{agent.full_name}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{agent.email}</span>
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {formData.type === 'virtual' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Link de Reunión
                                </label>
                                <input
                                    type="url"
                                    value={formData.meetingLink}
                                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                    placeholder="https://zoom.us/j/..."
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                                />
                            </div>
                        )}

                        {formData.type === 'presencial' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Ubicación
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Dirección de la reunión"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Descripción / Agenda
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Temas a tratar..."
                                rows={3}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                            />
                        </div>

                        {!initialData && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Repetir
                                    </label>
                                    <select
                                        value={recurrence}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setRecurrence(val);
                                            if (val === 'daily') setRecurrenceCount(5);
                                            else if (val === 'weekly') setRecurrenceCount(4);
                                            else setRecurrenceCount(1);
                                        }}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                                    >
                                        <option value="none">No repetir</option>
                                        <option value="daily">Diariamente</option>
                                        <option value="weekly">Semanalmente</option>
                                    </select>
                                </div>
                                {recurrence !== 'none' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Veces
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={recurrenceCount}
                                            onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 1)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0056fc]"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                            >
                                {loading ? 'Guardando...' : (initialData ? 'Actualizar Cita' : 'Agendar Cita')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ModalPortal>
    )
}