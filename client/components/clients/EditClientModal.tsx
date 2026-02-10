'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Save, Loader2, Building2, User, Mail, Phone, Calendar, UserCheck } from 'lucide-react'

interface Client {
    id: string
    company_name: string
    contact_name: string
    email: string
    phone: string
    origin?: string
    assigned_agent_id?: string
    assignment_expires_at?: string
}

interface Agent {
    id: string
    full_name: string
    email: string
}

interface EditClientModalProps {
    client: Client
    onClose: () => void
    onSuccess: () => void
}

export default function EditClientModal({ client, onClose, onSuccess }: EditClientModalProps) {
    const [loading, setLoading] = useState(false)
    const [agents, setAgents] = useState<Agent[]>([])
    const [formData, setFormData] = useState({
        company_name: client.company_name || '',
        contact_name: client.contact_name || '',
        email: client.email || '',
        phone: client.phone || '',
        origin: client.origin || 'MANUAL',
        assigned_agent_id: client.assigned_agent_id || '',
    })

    // Assignment Duration State
    const [duration, setDuration] = useState('3') // Default 3 months
    const [customDate, setCustomDate] = useState('')

    const supabase = createClient()

    // Load initial data
    useEffect(() => {
        const fetchAgents = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/agents`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setAgents(data)
                }
            } catch (error) {
                console.error('Error fetching agents:', error)
            }
        }

        fetchAgents()

        // Reset form
        setFormData({
            company_name: client.company_name || '',
            contact_name: client.contact_name || '',
            email: client.email || '',
            phone: client.phone || '',
            origin: client.origin || 'MANUAL',
            assigned_agent_id: client.assigned_agent_id || '',
        })

        // Set initial custom date if needed (or just default to logic)
        if (client.assignment_expires_at) {
            // Logic to check if it matches a standard duration could go here, 
            // but for simplicity we might just default to standard or show custom if strict
        }
    }, [client])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Calculate Expiration
            let expiresAt = new Date()
            if (duration === 'custom') {
                if (!customDate) {
                    alert('Por favor selecciona una fecha de expiración')
                    setLoading(false)
                    return
                }
                expiresAt = new Date(customDate)
            } else {
                expiresAt.setMonth(expiresAt.getMonth() + parseInt(duration))
            }

            const payload = {
                ...formData,
                assignment_expires_at: expiresAt.toISOString()
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients/${client.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || 'Error actualizando cliente')
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Error al actualizar el cliente. Intente nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 display-flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#000D42] to-[#0066FF] px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Building2 size={24} className="text-blue-200" />
                        Editar Cliente
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LEFT COLUMN: Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-[#000D42] uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Información General</h3>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Empresa</label>
                                <input
                                    required
                                    value={formData.company_name}
                                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contacto Principal</label>
                                <input
                                    value={formData.contact_name}
                                    onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                                <input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Origen</label>
                                <select
                                    value={formData.origin}
                                    onChange={e => setFormData({ ...formData, origin: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white"
                                >
                                    <option value="APP COBUS">APP COBUS</option>
                                    <option value="MANUAL">Manual / Directo</option>
                                    <option value="REFERIDO">Referido</option>
                                    <option value="WEB">Sitio Web</option>
                                    <option value="REDES">Redes Sociales</option>
                                </select>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Assignment */}
                        <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <h3 className="text-sm font-bold text-[#0066FF] uppercase tracking-wider border-b border-blue-100 pb-2 mb-4 flex items-center gap-2">
                                <UserCheck size={16} /> Asignación y Vigencia
                            </h3>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Agente Asignado</label>
                                <select
                                    value={formData.assigned_agent_id}
                                    onChange={e => setFormData({ ...formData, assigned_agent_id: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-sm bg-white"
                                >
                                    <option value="">-- Sin Asignar --</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.full_name || agent.email}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tiempo de Asignación</label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {[
                                        { value: '3', label: '3 Meses (Default)' },
                                        { value: '6', label: '6 Meses' },
                                        { value: '12', label: '1 Año' },
                                        { value: 'custom', label: 'Personalizado' },
                                    ].map(opt => (
                                        <button
                                            type="button"
                                            key={opt.value}
                                            onClick={() => setDuration(opt.value)}
                                            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${duration === opt.value
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {duration === 'custom' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha de Expiración</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                            <input
                                                type="date"
                                                value={customDate}
                                                onChange={e => setCustomDate(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 p-3 bg-blue-100 rounded-lg text-xs text-blue-800">
                                    <p className="font-bold mb-1">Nota:</p>
                                    <p>Al vencer el tiempo de asignación, el cliente podría ser liberado o reasignado automáticamente según las reglas de negocio.</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.company_name}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Guardar Cambios
                        </button>
                    </div>

                </form>
            </div >
        </div >
    )
}
