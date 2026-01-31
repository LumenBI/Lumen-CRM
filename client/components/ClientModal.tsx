'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    X as LucideX,
    Phone,
    Mail,
    Calendar,
    MessageSquare,
    CheckCircle2,
    DollarSign as LucideDollarSign
} from 'lucide-react'
import { INTERACTION_TYPES } from '@/constants/interactions'

// Create aliases for icons
const DollarSign = LucideDollarSign

// Icon map for dynamic icon rendering
const ICON_MAP: { [key: string]: React.ComponentType<{ size?: number; className?: string }> } = {
    Phone,
    Mail,
    Calendar,
    MessageSquare,
    CheckCircle2,
}

type Interaction = {
    id: string
    category: string
    modality: string
    summary: string
    created_at: string
    amount_usd?: number
}

type ClientData = {
    id: string
    company_name: string
    contact_name: string
    email: string
    phone?: string
    status: string
}

export default function ClientModal({ clientId, onClose }: { clientId: string, onClose: () => void }) {
    const [client, setClient] = useState<ClientData | null>(null)
    const [history, setHistory] = useState<Interaction[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Formulario nueva interacción
    const [newNote, setNewNote] = useState('')
    const [type, setType] = useState('CALL') // CALL, EMAIL, MEETING

    const supabase = createClient()

    // 1. Cargar Datos al Abrir
    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients/${clientId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                })
                const data = await res.json()
                setClient(data.client)
                setHistory(data.interactions)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [clientId])

    // 2. Guardar Nueva Interacción
    const handleSaveInteraction = async () => {
        if (!newNote.trim()) return
        setIsSubmitting(true)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/interactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    clientId,
                    category: INTERACTION_TYPES.find(t => t.value === type)?.backendValue || type,
                    modality: 'N_A', // Simplificado para velocidad
                    summary: newNote,
                    amount_usd: type === 'SALE' ? 1000 : 0 // Ejemplo: Si es venta, asignamos valor dummy o podrías pedirlo
                })
            })

            if (res.ok) {
                const newInteraction = await res.json()
                setHistory([newInteraction, ...history]) // Actualizar lista visualmente
                setNewNote('')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!clientId) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                {/* Header - MEJORADO con gradiente Star Cargo */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#000D42] to-[#0066FF] px-8 py-6 shadow-lg">
                    <div>
                        <h2 className="text-3xl font-bold text-white">
                            {loading ? 'Cargando...' : client?.company_name}
                        </h2>
                        {!loading && client && (
                            <p className="text-blue-100 mt-1">Detalles del cliente</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-3 bg-white/20 hover:bg-white/30 transition-all hover:scale-110"
                    >
                        <LucideX size={24} className="text-white" />
                    </button>
                </div>
                {/* Body */}
                <div className="flex max-h-[calc(95vh-120px)] overflow-hidden">
                    {/* Sidebar: Info del Cliente - MEJORADO */}
                    <div className="w-96 border-r bg-gradient-to-b from-gray-50 to-white p-8">
                        <h3 className="mb-6 text-sm font-bold uppercase text-[#000D42] tracking-wider">Información de Contacto</h3>
                        {loading ? (
                            <p className="text-gray-500">Cargando...</p>
                        ) : (
                            <div className="space-y-5">
                                <div className="group">
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-all border border-gray-100">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                                            <Phone className="text-white" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</p>
                                            <p className="font-bold text-gray-900 mt-1">{client?.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="group">
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-all border border-gray-100">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                                            <Mail className="text-white" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                                            <p className="font-bold text-gray-900 mt-1 text-sm break-all">{client?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <hr className="my-8 border-gray-200" />

                        <h3 className="mb-6 text-sm font-bold uppercase text-[#000D42] tracking-wider">Registrar Nueva Actividad</h3>
                        <div className="space-y-4">
                            {/* Custom Select with Icons */}
                            <div className="relative">
                                <div className="grid grid-cols-3 gap-2">
                                    {INTERACTION_TYPES.map(t => {
                                        const IconComponent = ICON_MAP[t.icon]
                                        return (
                                            <button
                                                key={t.value}
                                                type="button"
                                                onClick={() => setType(t.value)}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${type === t.value
                                                    ? 'border-[#0066FF] bg-blue-50 shadow-md'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {IconComponent && (
                                                    <IconComponent
                                                        size={20}
                                                        className={type === t.value ? 'text-[#0066FF]' : 'text-gray-500'}
                                                    />
                                                )}
                                                <span className={`text-xs font-medium text-center ${type === t.value ? 'text-[#0066FF]' : 'text-gray-700'
                                                    }`}>
                                                    {t.label}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <textarea
                                className="h-32 w-full resize-none rounded-xl border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Describe la interacción (ej: 'Se envió propuesta de 3 servicios, seguimiento en 2 días.')"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            />
                            <button
                                onClick={handleSaveInteraction}
                                disabled={isSubmitting || !newNote.trim()}
                                className="group relative w-full rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-lg"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle2 size={20} />
                                    {isSubmitting ? 'Guardando...' : 'Guardar Interacción'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Columna Derecha: Historial (Timeline) - MEJORADO */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <h3 className="mb-4 text-lg font-bold text-[#000D42] flex items-center gap-2">
                            <Calendar size={20} className="text-[#0066FF]" />
                            Historial de Interacciones
                        </h3>
                        {loading ? <p className="text-gray-500">Cargando historial...</p> : (
                            <div className="relative space-y-8 border-l-2 border-gray-100 pl-6">
                                {history.length === 0 && <p className="text-sm text-gray-400">Sin interacciones registradas aún.</p>}
                                {history.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <span className={`absolute -left-[31px] flex h-10 w-10 items-center justify-center rounded-xl shadow-lg border-2 border-white group-hover:scale-110 transition-transform ${item.category === 'QUOTE_DECISION' ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                                            item.category === 'CALL' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
                                                'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
                                            }`}>
                                            {item.category === 'QUOTE_DECISION' ? <DollarSign size={18} /> : <MessageSquare size={18} />}
                                        </span>
                                        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${item.category === 'QUOTE_DECISION' ? 'bg-green-100 text-green-700' :
                                                    item.category === 'CALL' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {item.category}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {new Date(item.created_at).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {item.summary}
                                            </p>
                                            {(item.amount_usd ?? 0) > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <span className="text-lg font-bold text-green-600">
                                                        ${(item.amount_usd ?? 0).toLocaleString()} USD
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {history.length === 0 && <p className="text-sm text-gray-400">Sin interacciones registradas aún.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
