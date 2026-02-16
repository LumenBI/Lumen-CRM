'use client'

import { useState, useEffect } from 'react'
import ModalPortal from '@/components/ui/ModalPortal'
import { toast } from 'sonner'
import { useApi } from '@/hooks/useApi'
import {
    X as LucideX,
    Phone,
    Mail,
    Calendar,
    MessageSquare,
    CheckCircle2,
    Briefcase,
    DollarSign as LucideDollarSign
} from 'lucide-react'
import { INTERACTION_TYPES } from '@/constants/interactions'
import { useUser } from '@/context/UserContext'
import { Client, Interaction, Deal } from '@/types'

const DollarSign = LucideDollarSign

const ICON_MAP: { [key: string]: React.ComponentType<{ size?: number; className?: string }> } = {
    Phone,
    Mail,
    Calendar,
    MessageSquare,
    CheckCircle2,
    Briefcase,
}

export default function ClientModal({ clientId, onClose, onSuccess }: { clientId: string, onClose: () => void, onSuccess?: () => void }) {
    const { profile } = useUser()
    const { clients: clientsApi, appointments: appointmentsApi, interactions: interactionsApi } = useApi()

    const [client, setClient] = useState<Client | null>(null)
    const [history, setHistory] = useState<Interaction[]>([])
    const [deals, setDeals] = useState<Deal[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [newNote, setNewNote] = useState('')
    const [type, setType] = useState('CALL')
    const [modality, setModality] = useState('N_A')
    const [scheduleFuture, setScheduleFuture] = useState(false)
    const [futureDate, setFutureDate] = useState('')
    const [futureTime, setFutureTime] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await clientsApi.getById(clientId)
                setClient(data.client)
                setHistory(data.interactions)
                setDeals(data.deals || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [clientId, clientsApi])

    useEffect(() => {
        const selectedType = INTERACTION_TYPES.find(t => t.value === type)
        if (selectedType) {
            if (selectedType.defaultModality) {
                setModality(selectedType.defaultModality)
            } else if (selectedType.requiresModality) {
                setModality('VIRTUAL')
            } else {
                setModality('N_A')
            }
        }
    }, [type])

    const handleSaveInteraction = async () => {
        if (!newNote.trim()) return
        if (scheduleFuture && (!futureDate || !futureTime)) return
        if (profile?.role !== 'ADMIN' && profile?.role !== 'MANAGER') {
            if (client?.assigned_agent_id !== profile?.id) {
                toast.error('No tienes permisos para registrar actividad en este cliente.')
                return
            }
        }

        setIsSubmitting(true)

        try {
            const selectedType = INTERACTION_TYPES.find(t => t.value === type)
            if (!selectedType) return

            if (scheduleFuture) {
                await appointmentsApi.create({
                    client_id: clientId,
                    title: `${selectedType.label} con Cliente`,
                    description: newNote,
                    appointment_date: futureDate,
                    appointment_time: futureTime,
                    appointment_type: selectedType.backendValue === 'MEETING' ? (modality === 'IN_PERSON' ? 'presencial' : 'virtual') : 'virtual',
                    meeting_link: '',
                    location: '',
                } as any)

                toast.success('Cita agendada correctamente.')
            } else {
                const newInteraction = await interactionsApi.create({
                    clientId,
                    category: selectedType.backendValue,
                    modality: modality,
                    summary: newNote,
                    amount_usd: type === 'SALE' ? 1000 : 0
                })

                setHistory([newInteraction, ...history])
            }

            setNewNote('')
            setScheduleFuture(false)
            setFutureDate('')
            setFutureTime('')

            if (onSuccess) onSuccess()

        } catch (err) {
            console.error(err)
            toast.error('Error al guardar.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!clientId || !mounted) return null

    const canInteract = profile?.role === 'ADMIN' || profile?.role === 'MANAGER' || (client?.assigned_agent_id === profile?.id)

    const currentTypeConfig = INTERACTION_TYPES.find(t => t.value === type)

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="relative max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#000D42] to-[#0066FF] dark:from-slate-900 dark:to-blue-900/50 px-8 py-6 shadow-lg">
                        <div>
                            <h2 className="text-3xl font-bold text-white">
                                {loading ? 'Cargando...' : client?.company_name}
                            </h2>
                            {!loading && client && (
                                <p className="text-blue-100 dark:text-blue-200 mt-1">Detalles del cliente</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-xl p-3 bg-white/20 hover:bg-white/30 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-all hover:scale-110"
                        >
                            <LucideX size={24} className="text-white" />
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row max-h-[calc(95vh-100px)] overflow-hidden">
                        <div className="w-full lg:w-96 border-b lg:border-r lg:border-b-0 border-slate-100 dark:border-slate-800 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 p-6 lg:p-8 overflow-y-auto shrink-0">
                            <h3 className="mb-6 text-sm font-bold uppercase text-[#000D42] dark:text-blue-400 tracking-wider">Información de Contacto</h3>
                            {loading ? (
                                <p className="text-gray-500 dark:text-slate-400">Cargando...</p>
                            ) : (
                                <div className="space-y-5">
                                    <div className="group">
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-slate-700">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                                                <Phone className="text-white" size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Teléfono</p>
                                                <p className="font-bold text-gray-900 dark:text-white mt-1">{client?.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-slate-700">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                                                <Mail className="text-white" size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Email</p>
                                                <p className="font-bold text-gray-900 dark:text-white mt-1 text-sm break-all">{client?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <hr className="my-8 border-gray-200 dark:border-slate-800" />

                            <h3 className="mb-6 text-sm font-bold uppercase text-[#000D42] dark:text-blue-400 tracking-wider">Nueva Actividad</h3>
                            {!canInteract && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
                                    <LucideX size={16} />
                                    Solo el agente asignado puede registrar actividad.
                                </div>
                            )}
                            <div className={`space-y-4 ${!canInteract ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                <div className="relative">
                                    <div className="grid grid-cols-3 gap-2">
                                        {INTERACTION_TYPES.map(t => {
                                            const IconComponent = ICON_MAP[t.icon] || MessageSquare
                                            return (
                                                <button
                                                    key={t.value}
                                                    type="button"
                                                    onClick={() => setType(t.value)}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${type === t.value
                                                        ? 'border-[#0066FF] bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800'
                                                        }`}
                                                >
                                                    {IconComponent && (
                                                        <IconComponent
                                                            size={20}
                                                            className={type === t.value ? 'text-[#0066FF] dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'}
                                                        />
                                                    )}
                                                    <span className={`text-xs font-medium text-center ${type === t.value ? 'text-[#0066FF] dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'
                                                        }`}>
                                                        {t.label}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {currentTypeConfig?.requiresModality && (
                                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-800 p-2 rounded-xl border border-gray-100 dark:border-slate-700">
                                        <button
                                            onClick={() => setModality('VIRTUAL')}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${modality === 'VIRTUAL' ? 'bg-white dark:bg-slate-900 text-[#0066FF] dark:text-blue-400 shadow-sm border border-gray-100 dark:border-slate-800' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                                        >
                                            Virtual
                                        </button>
                                        <button
                                            onClick={() => setModality('IN_PERSON')}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${modality === 'IN_PERSON' ? 'bg-white dark:bg-slate-900 text-[#0066FF] dark:text-blue-400 shadow-sm border border-gray-100 dark:border-slate-800' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                                        >
                                            Presencial
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                    <input
                                        type="checkbox"
                                        id="scheduleFuture"
                                        checked={scheduleFuture}
                                        onChange={(e) => setScheduleFuture(e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                                    />
                                    <label htmlFor="scheduleFuture" className="text-sm font-semibold text-blue-900 dark:text-blue-300 cursor-pointer select-none">
                                        Agendar como cita futura
                                        <p className="text-xs font-normal text-blue-600 dark:text-blue-400">Se guardará en el calendario</p>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Fecha</label>
                                        <input
                                            type="date"
                                            required
                                            value={futureDate}
                                            onChange={(e) => setFutureDate(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Hora</label>
                                        <input
                                            type="time"
                                            required
                                            value={futureTime}
                                            onChange={(e) => setFutureTime(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <textarea
                                    className="h-32 w-full resize-none rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder={scheduleFuture ? "Detalles de la cita (agenda)..." : "Describe la interacción..."}
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                                <button
                                    onClick={handleSaveInteraction}
                                    disabled={isSubmitting || !newNote.trim() || (scheduleFuture && (!futureDate || !futureTime))}
                                    className="group relative w-full rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-lg"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {scheduleFuture ? <Calendar size={20} /> : <CheckCircle2 size={20} />}
                                        {isSubmitting ? 'Guardando...' : scheduleFuture ? 'Agendar Cita' : 'Guardar Actividad'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white dark:bg-slate-900/50">

                            <div className="mb-8 border-b border-gray-100 dark:border-slate-800 pb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-[#000D42] dark:text-white flex items-center gap-2">
                                        <Briefcase size={20} className="text-[#0066FF] dark:text-blue-400" />
                                        Seguimientos activos ({deals.length})
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {deals.length === 0 && <p className="text-sm text-gray-400 dark:text-slate-500 italic">No hay seguimientos activos.</p>}
                                    {deals.map(deal => (
                                        <div key={deal.id} className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-800/50 flex justify-between items-center group">
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-[#0066FF] dark:group-hover:text-blue-400 transition-colors">{deal.title}</h4>
                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex gap-2">
                                                    <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className="font-medium text-gray-700">${deal.value?.toLocaleString()} {deal.currency}</span>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${deal.status === 'CERRADO_GANADO' ? 'bg-green-100 text-green-700' :
                                                deal.status === 'CERRADO_PERDIDO' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-50 text-blue-700'
                                                }`}>
                                                {deal.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h3 className="mb-4 text-lg font-bold text-[#000D42] dark:text-white flex items-center gap-2">
                                <Calendar size={20} className="text-[#0066FF] dark:text-blue-400" />
                                Historial
                            </h3>
                            {loading ? <p className="text-gray-500 dark:text-slate-400">Cargando historial...</p> : (
                                <div className="relative space-y-8 border-l-2 border-gray-100 dark:border-slate-800 pl-6 ml-2">
                                    {history.length === 0 && <p className="text-sm text-gray-400 dark:text-slate-500">Sin interacciones registradas aún.</p>}
                                    {history.map((item) => {
                                        const CATEGORY_LABELS: Record<string, string> = {
                                            'CALL': 'LLAMADA',
                                            'EMAIL': 'CORREO',
                                            'MEETING': item.modality === 'IN_PERSON' ? 'VISITA COMERCIAL' : 'REUNIÓN',
                                            'WHATSAPP': 'WHATSAPP',
                                            'QUOTE_DECISION': 'VENTA CERRADA',
                                            'SEGUIMIENTO': 'SEGUIMIENTO'
                                        };
                                        const displayCategory = CATEGORY_LABELS[item.category] || item.category;

                                        return (
                                            <div key={item.id} className="relative group">
                                                <span className={`absolute -left-[33px] flex h-10 w-10 items-center justify-center rounded-xl shadow-lg border-2 border-white group-hover:scale-110 transition-transform ${item.category === 'QUOTE_DECISION' ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                                                    item.category === 'CALL' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
                                                        'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
                                                    }`}>
                                                    {item.category === 'QUOTE_DECISION' ? <DollarSign size={18} /> : <MessageSquare size={18} />}
                                                </span>
                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-slate-700">
                                                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${item.category === 'QUOTE_DECISION' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            item.category === 'CALL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                            }`}>
                                                            {displayCategory}
                                                        </span>
                                                        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                                                            {new Date(item.created_at).toLocaleDateString('es-ES', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed break-words">
                                                        {item.summary}
                                                    </p>
                                                    {(item.amount_usd ?? 0) > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                                            <span className="text-lg font-bold text-green-600 dark:text-emerald-400">
                                                                ${(item.amount_usd ?? 0).toLocaleString()} USD
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}