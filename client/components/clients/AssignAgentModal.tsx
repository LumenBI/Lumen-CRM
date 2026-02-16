'use client'

import { useState } from 'react'
import { X, UserCheck, Loader2 } from 'lucide-react'
import ModalPortal from '@/components/ui/ModalPortal'
import { useAgents } from '@/context/AgentsContext'
import { useClients } from '@/context/ClientsContext'
import { toast } from 'sonner'
import type { Client } from '@/types'

interface AssignAgentModalProps {
    client: Client
    onClose: () => void
    onSuccess: () => void
}

export default function AssignAgentModal({ client, onClose, onSuccess }: AssignAgentModalProps) {
    const [loading, setLoading] = useState(false)
    const [agentId, setAgentId] = useState(client.assigned_agent_id || '')
    const [duration, setDuration] = useState('3')

    const { agents } = useAgents()
    const { updateClient } = useClients()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const expiresAt = new Date()
            expiresAt.setMonth(expiresAt.getMonth() + parseInt(duration))

            await updateClient(client.id, {
                assigned_agent_id: agentId || undefined,
                assignment_expires_at: expiresAt.toISOString()
            })

            toast.success('Agente asignado correctamente')
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error al asignar agente')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ModalPortal>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                <div className="bg-gradient-to-r from-[#000D42] to-[#0066FF] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserCheck size={24} className="text-blue-200" />
                        Asignar Agente
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                            Selecciona un agente para <span className="font-bold text-gray-900 dark:text-white">{client.company_name}</span>
                        </p>

                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Agente</label>
                        <select
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                            <option value="">-- Sin Asignar --</option>
                            {agents.map(agent => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.full_name || agent.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duración de la Asignación</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: '3', label: '3 Meses' },
                                { value: '6', label: '6 Meses' },
                                { value: '12', label: '1 Año' },
                                { value: '24', label: '2 Años' },
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
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} />}
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    )
}
