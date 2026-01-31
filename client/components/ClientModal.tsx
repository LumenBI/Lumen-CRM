'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    LucideX, LucidePhone, LucideMail, LucideCalendar,
    LucideMessageSquare, LucideCheckCircle2, LucideDollarSign
} from 'lucide-react'

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
                    category: type === 'SALE' ? 'QUOTE_DECISION' : type, // Mapeo simple
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                    <div>
                        {loading ? <div className="h-6 w-32 animate-pulse bg-gray-200 rounded"></div> : (
                            <>
                                <h2 className="text-xl font-bold text-gray-800">{client?.company_name}</h2>
                                <p className="text-sm text-gray-500">{client?.contact_name}</p>
                            </>
                        )}
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200">
                        <LucideX className="text-gray-500" />
                    </button>
                </div>

                <div className="flex h-[500px]">
                    {/* Columna Izquierda: Acciones y Datos */}
                    <div className="w-1/3 border-r bg-gray-50 p-5">
                        <div className="space-y-4">
                            <div className="rounded-lg bg-white p-3 shadow-sm">
                                <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                                    <LucideMail size={16} /> {client?.email || 'No email'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <LucidePhone size={16} /> {client?.phone || 'No phone'}
                                </div>
                            </div>

                            <hr />

                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Nueva Actividad</h3>
                            <div className="space-y-2">
                                <select
                                    className="w-full rounded border p-2 text-sm"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="CALL">📞 Llamada</option>
                                    <option value="MEETING">📅 Reunión</option>
                                    <option value="EMAIL">✉️ Correo</option>
                                    <option value="SALE">💰 Venta Cerrada</option>
                                </select>
                                <textarea
                                    className="h-24 w-full resize-none rounded border p-2 text-sm"
                                    placeholder="¿Qué se acordó?"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                                <button
                                    onClick={handleSaveInteraction}
                                    disabled={isSubmitting || loading}
                                    className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Guardando...' : 'Registrar'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Historial (Timeline) */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <h3 className="mb-4 font-bold text-gray-700">Historial de Interacciones</h3>
                        {loading ? <p>Cargando historia...</p> : (
                            <div className="relative space-y-6 border-l-2 border-gray-100 ml-3 pl-6">
                                {history.map((item) => (
                                    <div key={item.id} className="relative">
                                        <span className={`absolute -left-[31px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm ${item.category === 'QUOTE_DECISION' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {item.category === 'QUOTE_DECISION' ? <LucideDollarSign size={14} /> : <LucideMessageSquare size={14} />}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900">{item.category}</span>
                                                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                                                {item.summary}
                                            </p>
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
