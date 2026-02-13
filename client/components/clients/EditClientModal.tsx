'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, Building2, User, Mail, Phone, Calendar, UserCheck } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { useClients } from '@/context/ClientsContext'
import { useApi } from '@/hooks/useApi'
import { ORIGIN_OPTIONS } from '@/constants/interactions'
import ModalPortal from '@/components/ui/ModalPortal'
import type { Client } from '@/types'
import { useAgents } from '@/context/AgentsContext'

interface EditClientModalProps {
    client: Client
    onClose: () => void
    onSuccess: () => void
}

export default function EditClientModal({ client, onClose, onSuccess }: EditClientModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        company_name: client.company_name || '',
        contact_name: client.contact_name || '',
        email: client.email || '',
        phone: client.phone || '',
        origin: client.origin || 'MANUAL',
        assigned_agent_id: client.assigned_agent_id || '',
    })

    const [duration, setDuration] = useState('3')
    const [customDate, setCustomDate] = useState('')

    const { updateClient } = useClients()
    const { profile } = useUser()
    const { agents } = useAgents()

    useEffect(() => {
        setFormData({
            company_name: client.company_name || '',
            contact_name: client.contact_name || '',
            email: client.email || '',
            phone: client.phone || '',
            origin: client.origin || 'MANUAL',
            assigned_agent_id: client.assigned_agent_id || '',
        })
    }, [client])


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)

        try {
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

            await updateClient(client.id, payload)

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error:', error)
            alert('Error al actualizar el cliente. Intente nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ModalPortal>
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                <div className="bg-gradient-to-r from-[#000D42] to-[#0066FF] px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Building2 size={24} className="text-blue-200" />
                        Editar cliente
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-[#000D42] dark:text-blue-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">Información General</h3>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Empresa</label>
                                    <input
                                        required
                                        value={formData.company_name}
                                        onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contacto Principal</label>
                                    <input
                                        value={formData.contact_name}
                                        onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                                    <input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Origen</label>
                                    <select
                                        value={formData.origin}
                                        onChange={e => setFormData({ ...formData, origin: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none text-sm transition-all"
                                    >
                                        {ORIGIN_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {profile && (profile.role === 'ADMIN' || profile.role === 'MANAGER') && (
                                <div className="space-y-4 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <h3 className="text-sm font-bold text-[#0066FF] dark:text-blue-400 uppercase tracking-wider border-b border-blue-100 dark:border-blue-900/30 pb-2 mb-4 flex items-center gap-2">
                                        <UserCheck size={16} /> Asignación y Vigencia
                                    </h3>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Agente Asignado</label>
                                        <select
                                            value={formData.assigned_agent_id}
                                            onChange={e => setFormData({ ...formData, assigned_agent_id: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-blue-200 dark:border-slate-700 focus:border-blue-500 outline-none text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
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
                                                        ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md'
                                                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
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
                                                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-sm transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-xs text-blue-800 dark:text-blue-200">
                                            <p className="font-bold mb-1">Nota:</p>
                                            <p>Al vencer el tiempo de asignación, el cliente podría ser liberado o reasignado automáticamente según las reglas de negocio.</p>
                                        </div>
                                    </div>
                                </div>

                            )}
                        </div>
                    </div>

                    <div className="shrink-0 p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.company_name}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Guardar cambios
                        </button>
                    </div>

                </form>
            </div>
        </ModalPortal>
    )
}
