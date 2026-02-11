'use client'

import { useState, useEffect } from 'react'
import {
    LucideX,
    LucideLoader2,
    LucideSearch,
    LucideUserPlus,
    LucideCheck,
    LucideMessageSquare,
    LucideCalendar
} from 'lucide-react'
import { INTERACTION_TYPES, STATUS_OPTIONS } from '@/constants/interactions'
import { useUser } from '@/context/UserContext'
import { useApi } from '@/hooks/useApi'
import { useClients } from '@/context/ClientsContext'
import ModalPortal from '@/components/ui/ModalPortal'
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

    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [searching, setSearching] = useState(false)

    const [clientForm, setClientForm] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        origin: 'APP COBUS'
    })

    const [status, setStatus] = useState('PENDING')
    const [interaction, setInteraction] = useState({
        category: 'CALL',
        summary: ''
    })
    const [modality, setModality] = useState('N_A')

    const [scheduleFuture, setScheduleFuture] = useState(false)
    const [futureDate, setFutureDate] = useState('')
    const [futureTime, setFutureTime] = useState('')

    const { clients: clientsApi, appointments: appointmentsApi, interactions: interactionsApi } = useApi()
    const { searchClients, createClient, allClients } = useClients()
    const { profile } = useUser()

    useEffect(() => {
        if (mode === 'create') return

        if (searchTerm.trim() === '') {
            setSearchResults(allClients)
        } else {
            setSearchResults(searchClients(searchTerm))
        }
    }, [searchTerm, selectedClient, searchClients, mode, allClients])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let clientId = selectedClient?.id

            if (mode === 'select' && selectedClient && profile?.role !== 'ADMIN' && profile?.role !== 'MANAGER') {
                if (selectedClient.assigned_agent_id !== profile?.id) {
                    alert('No tienes permisos para gestionar este cliente. No está asignado a ti.')
                    setLoading(false)
                    return
                }
            }

            const selectedType = INTERACTION_TYPES.find(t => t.value === interaction.category)

            if (mode === 'create') {
                const newClient = await createClient({
                    ...clientForm,
                    status: status
                })
                clientId = newClient.id

                if (profile?.role !== 'ADMIN' && profile?.role !== 'MANAGER') {
                    if (status !== 'PENDING') {
                        alert('Cliente creado exitosamente. Debe ser asignado a ti para registrar seguimientos.')
                        onSuccess()
                        onClose()
                        return
                    }
                }

            } else if (clientId && status !== 'PENDING') {
                await clientsApi.move(clientId, status)
            }

            if (status !== 'PENDING' && interaction.summary && selectedType) {
                if (scheduleFuture) {
                    if (!futureDate || !futureTime) {
                        alert('Debes seleccionar fecha y hora para agendar.')
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
                        meeting_link: '',
                        location: '',
                    })
                } else {
                    await interactionsApi.create({
                        clientId,
                        category: selectedType.backendValue,
                        modality: modality,
                        summary: interaction.summary
                    })
                }
            }

            onSuccess()
            onClose()

        } catch (error) {
            console.error(error)
            alert('Ocurrió un error. Intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    const currentTypeConfig = INTERACTION_TYPES.find(t => t.value === interaction.category)

    return (
        <ModalPortal>
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-800">{TEXTS.NEW_ACTIVITY_TITLE}</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200">
                        <LucideX className="text-gray-500" size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">{TEXTS.CLIENTS_TITLE}</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setMode('select')}
                                    type="button"
                                    className={`flex-1 p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${mode === 'select'
                                        ? 'border-blue-500 bg-blue-50/50'
                                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${mode === 'select' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <LucideSearch size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Buscar existente</h3>
                                        <p className="text-xs text-gray-500">Busca por nombre o email</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setMode('create')}
                                    type="button"
                                    className={`flex-1 p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${mode === 'create'
                                        ? 'border-blue-500 bg-blue-50/50'
                                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${mode === 'create' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <LucideUserPlus size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Crear nuevo</h3>
                                        <p className="text-xs text-gray-500">Registrar nuevo cliente</p>
                                    </div>
                                </button>
                            </div>

                            {mode === 'select' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">{TEXTS.CLIENTS_TITLE}</label>

                                    {!selectedClient ? (
                                        <div className="relative">
                                            <LucideSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder={TEXTS.SEARCH_CLIENT}
                                                className="w-full rounded-xl border border-gray-200 pl-10 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                autoFocus
                                            />
                                            {searching && <LucideLoader2 className="absolute right-3 top-3 animate-spin text-blue-500" size={18} />}

                                            {searchResults.length > 0 && !selectedClient && (
                                                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                                                    {searchResults.map((client) => (
                                                        <button
                                                            key={client.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedClient(client)
                                                                setSearchTerm(client.company_name)
                                                                setSearchResults([])
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                                                        >
                                                            <div className="font-bold text-gray-800">{client.company_name}</div>
                                                            <div className="text-xs text-gray-500">{client.contact_name} • {client.email}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-sm text-green-600 flex items-center gap-1 bg-green-50 p-2 rounded-lg">
                                            <LucideCheck size={16} /> Seleccionado: <strong>{selectedClient.company_name}</strong>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedClient(null)
                                                    setSearchTerm('')
                                                }}
                                                className="ml-auto text-xs text-red-500 underline"
                                            >
                                                Cambiar
                                            </button>
                                        </div>
                                    )}
                                </div>

                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Empresa *</label>
                                        <input
                                            required
                                            className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500"
                                            placeholder="Nombre Comercial"
                                            value={clientForm.company_name}
                                            onChange={e => setClientForm({ ...clientForm, company_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Contacto</label>
                                        <input
                                            className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500"
                                            placeholder="Nombre del encargado"
                                            value={clientForm.contact_name}
                                            onChange={e => setClientForm({ ...clientForm, contact_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                                        <input
                                            className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500"
                                            placeholder="correo@ejemplo.com"
                                            type="email"
                                            value={clientForm.email}
                                            onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Teléfono</label>
                                        <input
                                            className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500"
                                            placeholder="+506 ..."
                                            value={clientForm.phone}
                                            onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Origen del Prospecto</label>
                                        <select
                                            className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 bg-white"
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
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 my-4"></div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Estado Inicial</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setStatus(opt.value)}
                                        className={`p-2 rounded-lg text-xs font-medium border transition-all ${status === opt.value
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {status !== 'PENDING' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                        <LucideMessageSquare size={16} /> Detalles del Contacto
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipo de Interacción</label>
                                                <select
                                                    className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 bg-white"
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
                                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Modalidad</label>
                                                    <select
                                                        className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 bg-white"
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
                                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Notas / Resumen</label>
                                            <textarea
                                                required
                                                className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 min-h-[80px]"
                                                placeholder="¿Qué se discutió? ¿Cuál es el siguiente paso?"
                                                value={interaction.summary}
                                                onChange={e => setInteraction({ ...interaction, summary: e.target.value })}
                                            />
                                        </div>

                                        <div className="pt-2 border-t border-blue-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <input
                                                    type="checkbox"
                                                    id="scheduleFuture"
                                                    checked={scheduleFuture}
                                                    onChange={e => setScheduleFuture(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                />
                                                <label htmlFor="scheduleFuture" className="text-sm font-medium text-blue-900 cursor-pointer">
                                                    Agendar cita
                                                </label>
                                            </div>

                                            {scheduleFuture && (
                                                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 bg-white p-3 rounded-lg border border-blue-100">
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={futureDate}
                                                            onChange={(e) => setFutureDate(e.target.value)}
                                                            className="w-full rounded-lg border border-gray-200 p-2 text-xs outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Hora</label>
                                                        <input
                                                            type="time"
                                                            required
                                                            value={futureTime}
                                                            onChange={(e) => setFutureTime(e.target.value)}
                                                            className="w-full rounded-lg border border-gray-200 p-2 text-xs outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (status !== 'PENDING' && !interaction.summary)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading && <LucideLoader2 className="animate-spin" size={18} />}
                            Guardar actividad
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    )
}
