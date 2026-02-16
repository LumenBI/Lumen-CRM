'use client'

import { useState, useEffect } from 'react'
import {
    LucideX,
    LucideLoader2,
    LucideSearch,
    LucideUserPlus,
    LucideCheck,
    LucideMessageSquare,
    LucideCalendar,
    LucideDollarSign,
    LucideBriefcase,
    LucideContainer,
    LucidePlane
} from 'lucide-react'
import { INTERACTION_TYPES } from '@/constants/interactions'
import { STAGES } from '@/constants/stages'
import { useUser } from '@/context/UserContext'
import { useApi } from '@/hooks/useApi'
import { useClients } from '@/context/ClientsContext'
import { useAppointments } from '@/context/AppointmentsContext'
import { useAgents } from '@/context/AgentsContext'
import ModalPortal from '@/components/ui/ModalPortal'
import { toast } from 'sonner'
import type { Client } from '@/types'
import { TEXTS } from '@/constants/text'

type NewTrackingModalProps = {
    onClose: () => void
    onSuccess: () => void
    initialMode?: 'select' | 'create'
}

export default function NewTrackingModal({ onClose, onSuccess, initialMode = 'select' }: NewTrackingModalProps) {
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'select' | 'create'>(initialMode)

    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    const [clientForm, setClientForm] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        origin: 'APP COBUS',
        assigned_agent_id: ''
    })

    const [status, setStatus] = useState('PENDING')
    const [interaction, setInteraction] = useState({
        category: 'CALL',
        summary: ''
    })
    const [modality, setModality] = useState('N_A')

    const [dealMetadata, setDealMetadata] = useState({
        value: '',
        currency: 'USD',
        type: 'AEREO'
    })

    const [scheduleFuture, setScheduleFuture] = useState(false)
    const [futureDate, setFutureDate] = useState('')
    const [futureTime, setFutureTime] = useState('')
    const [meetingLink, setMeetingLink] = useState('')
    const [location, setLocation] = useState('')

    const { clients: clientsApi, appointments: appointmentsApi, interactions: interactionsApi } = useApi()
    const { clients: searchResults, searchTerm, setSearchTerm, createClient, loading: searching } = useClients()
    const { refreshAppointments } = useAppointments()
    const { profile } = useUser()
    const { agents } = useAgents()

    // No local effect needed as context handles search

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let clientId = selectedClient?.id

            if (mode === 'select' && selectedClient && profile?.role !== 'ADMIN' && profile?.role !== 'MANAGER') {
                if (selectedClient.assigned_agent_id !== profile?.id) {
                    toast.error('No tienes permisos para gestionar este cliente. No está asignado a ti.')
                    setLoading(false)
                    return
                }
            }

            const selectedType = INTERACTION_TYPES.find(t => t.value === interaction.category)

            if (mode === 'create') {
                const newClient = await createClient({
                    ...clientForm,
                    status: status,
                    dealMetadata: {
                        value: parseFloat(dealMetadata.value) || 0,
                        currency: dealMetadata.currency,
                        type: dealMetadata.type
                    }
                })
                clientId = newClient.id
            } else if (clientId && status !== 'PENDING') {
                await clientsApi.update(clientId, { status })
            }

            if (status !== 'PENDING' && interaction.summary && selectedType) {
                if (scheduleFuture) {
                    if (!futureDate || !futureTime) {
                        toast.error('Debes seleccionar fecha y hora para agendar.')
                        setLoading(false)
                        return
                    }
                    await appointmentsApi.create({
                        client: { id: clientId } as any,
                        title: `${selectedType.label} con Cliente`,
                        description: interaction.summary,
                        appointment_date: futureDate,
                        appointment_time: futureTime,
                        appointment_type: selectedType.backendValue === 'MEETING' ? (modality === 'IN_PERSON' ? 'presencial' : 'virtual') : 'virtual',
                        meeting_link: meetingLink,
                        location: location,
                    })
                    toast.success('Cita agendada correctamente')
                    refreshAppointments() // Refresh calendar immediately
                } else {
                    await interactionsApi.create({
                        clientId,
                        category: selectedType.backendValue,
                        modality: modality,
                        summary: interaction.summary
                    })
                    toast.success('Actividad registrada correctamente')
                }
            }

            onSuccess()
            onClose()

        } catch (error) {
            console.error(error)
            toast.error('Ocurrió un error. Intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    const currentTypeConfig = INTERACTION_TYPES.find(t => t.value === interaction.category)

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border dark:border-slate-800">

                    <div className="flex items-center justify-between border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 px-6 py-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TEXTS.NEW_ACTIVITY_TITLE}</h2>
                        <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors">
                            <LucideX className="text-gray-500 dark:text-gray-400" size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">{TEXTS.CLIENTS_TITLE}</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setMode('select')}
                                        type="button"
                                        className={`flex-1 p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${mode === 'select'
                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                                            : 'border-gray-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/40 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${mode === 'select' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
                                            <LucideSearch size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-slate-200">Buscar existente</h3>
                                            <p className="text-xs text-gray-500 dark:text-slate-500">Busca por nombre o email</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setMode('create')}
                                        type="button"
                                        className={`flex-1 p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${mode === 'create'
                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                                            : 'border-gray-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/40 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${mode === 'create' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
                                            <LucideUserPlus size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-slate-200">Crear nuevo</h3>
                                            <p className="text-xs text-gray-500 dark:text-slate-500">Registrar nuevo cliente</p>
                                        </div>
                                    </button>
                                </div>

                                {mode === 'select' ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">{TEXTS.CLIENTS_TITLE}</label>

                                        {!selectedClient ? (
                                            <div className="relative">
                                                <LucideSearch className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder={TEXTS.SEARCH_CLIENT}
                                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 pl-10 p-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    autoFocus
                                                />
                                                {searching && <LucideLoader2 className="absolute right-3 top-3 animate-spin text-blue-500" size={18} />}

                                                {searchResults.length > 0 && !selectedClient && (
                                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 max-h-60 overflow-y-auto">
                                                        {searchResults.map((client) => (
                                                            <button
                                                                key={client.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedClient(client)
                                                                    setSearchTerm(client.company_name)
                                                                }}
                                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-50 dark:border-slate-700 last:border-0"
                                                            >
                                                                <div className="font-bold text-gray-800 dark:text-slate-200">{client.company_name}</div>
                                                                <div className="text-xs text-gray-500 dark:text-slate-400">{client.contact_name} • {client.email}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/10 p-2 rounded-lg">
                                                <LucideCheck size={16} /> Seleccionado: <strong>{selectedClient.company_name}</strong>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedClient(null)
                                                        setSearchTerm('')
                                                    }}
                                                    className="ml-auto text-xs text-red-500 dark:text-red-400 underline"
                                                >
                                                    Cambiar
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Empresa *</label>
                                            <input
                                                required
                                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                placeholder="Nombre Comercial"
                                                value={clientForm.company_name}
                                                onChange={e => setClientForm({ ...clientForm, company_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Contacto</label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                placeholder="Nombre del encargado"
                                                value={clientForm.contact_name}
                                                onChange={e => setClientForm({ ...clientForm, contact_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Email</label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                placeholder="correo@ejemplo.com"
                                                type="email"
                                                value={clientForm.email}
                                                onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Teléfono</label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                placeholder="+506 ..."
                                                value={clientForm.phone}
                                                onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Origen del Prospecto</label>
                                            <select
                                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                value={clientForm.origin}
                                                onChange={e => setClientForm({ ...clientForm, origin: e.target.value })}
                                            >
                                                <option value="APP COBUS">APP COBUS</option>
                                                <option value="MANUAL">Manual / Directo</option>
                                                <option value="REFERIDO">Referido</option>
                                                <option value="WEB">Sitio Web</option>
                                                <option value="REDES">Redes Sociales</option>
                                            </select>
                                        </div>
                                        {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Asignar Agente (Opcional)</label>
                                                <select
                                                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                    value={clientForm.assigned_agent_id}
                                                    onChange={e => setClientForm({ ...clientForm, assigned_agent_id: e.target.value })}
                                                >
                                                    <option value="">-- Sin Asignar --</option>
                                                    {agents.map(agent => (
                                                        <option key={agent.id} value={agent.id}>{agent.full_name || agent.email}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 dark:border-slate-800 my-4"></div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Estado Inicial</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {STAGES.map(stage => (
                                        <button
                                            key={stage.id}
                                            type="button"
                                            onClick={() => setStatus(stage.id)}
                                            className={`p-2 rounded-lg text-xs font-medium border transition-all ${status === stage.id
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-900'
                                                }`}
                                        >
                                            {stage.title}
                                        </button>
                                    ))}
                                </div>

                                {mode === 'create' && status !== 'PENDING' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-emerald-50/50 dark:bg-emerald-900/5 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/20 mb-4">
                                        <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
                                            <LucideBriefcase size={16} /> Detalles de la Oportunidad
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Valor Estimado</label>
                                                    <div className="relative">
                                                        <LucideDollarSign className="absolute left-2.5 top-2.5 text-gray-400 dark:text-slate-500" size={14} />
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                                            placeholder="0.00"
                                                            value={dealMetadata.value}
                                                            onChange={e => setDealMetadata({ ...dealMetadata, value: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Moneda</label>
                                                    <select
                                                        className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                                        value={dealMetadata.currency}
                                                        onChange={e => setDealMetadata({ ...dealMetadata, currency: e.target.value })}
                                                    >
                                                        <option value="USD">USD - Dólar</option>
                                                        <option value="MXN">MXN - Peso</option>
                                                        <option value="EUR">EUR - Euro</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Tipo de Operación</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { id: 'FCL', label: 'FCL', icon: LucideContainer },
                                                        { id: 'LCL', label: 'LCL', icon: LucideBriefcase },
                                                        { id: 'AEREO', label: 'Aéreo', icon: LucidePlane },
                                                    ].map(type => (
                                                        <button
                                                            key={type.id}
                                                            type="button"
                                                            onClick={() => setDealMetadata({ ...dealMetadata, type: type.id })}
                                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${dealMetadata.type === type.id
                                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                                                : 'border-gray-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/50 text-gray-600 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            <type.icon size={16} />
                                                            <span className="text-[10px] font-bold">{type.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {status !== 'PENDING' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-blue-50/50 dark:bg-blue-900/5 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                                            <LucideMessageSquare size={16} /> Detalles del Contacto
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Tipo de Interacción</label>
                                                    <select
                                                        className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                        value={interaction.category}
                                                        onChange={e => setInteraction({ ...interaction, category: e.target.value })}
                                                    >
                                                        {INTERACTION_TYPES.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {currentTypeConfig?.requiresModality && (
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Modalidad</label>
                                                        <select
                                                            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                            value={modality}
                                                            onChange={e => setModality(e.target.value)}
                                                        >
                                                            <option value="VIRTUAL">Virtual</option>
                                                            <option value="IN_PERSON">Presencial</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Notas / Resumen</label>
                                                <textarea
                                                    required
                                                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 min-h-[80px]"
                                                    placeholder="¿Qué se discutió? ¿Cuál es el siguiente paso?"
                                                    value={interaction.summary}
                                                    onChange={e => setInteraction({ ...interaction, summary: e.target.value })}
                                                />
                                            </div>

                                            <div className="pt-2 border-t border-blue-100 dark:border-blue-900/30">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="checkbox"
                                                        id="scheduleFuture"
                                                        checked={scheduleFuture}
                                                        onChange={e => setScheduleFuture(e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800"
                                                    />
                                                    <label htmlFor="scheduleFuture" className="text-sm font-medium text-blue-900 dark:text-blue-300 cursor-pointer">
                                                        Agendar cita
                                                    </label>
                                                </div>

                                                {scheduleFuture && (
                                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 bg-white dark:bg-slate-800/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Fecha</label>
                                                                <input
                                                                    type="date"
                                                                    required
                                                                    value={futureDate}
                                                                    onChange={(e) => setFutureDate(e.target.value)}
                                                                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Hora</label>
                                                                <input
                                                                    type="time"
                                                                    required
                                                                    value={futureTime}
                                                                    onChange={(e) => setFutureTime(e.target.value)}
                                                                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Link de Reunión (Opcional)</label>
                                                                <input
                                                                    type="url"
                                                                    value={meetingLink}
                                                                    onChange={(e) => setMeetingLink(e.target.value)}
                                                                    placeholder="https://zoom.us/..."
                                                                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 block">Ubicación (Opcional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={location}
                                                                    onChange={(e) => setLocation(e.target.value)}
                                                                    placeholder="Ej: Sala de Juntas"
                                                                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-slate-800 p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (status !== 'PENDING' && !interaction.summary) || (mode === 'select' && !selectedClient)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading && <LucideLoader2 className="animate-spin" size={18} />}
                                Guardar actividad
                            </button>
                        </div>
                    </form>
                </div >
            </div>
        </ModalPortal >
    )
}
