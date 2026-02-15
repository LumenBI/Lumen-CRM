'use client'

import { useState, useEffect } from 'react'
import { LucideX, LucideLoader2, LucideSearch, LucideCheck, LucideDollarSign, LucideBriefcase, LucideContainer, LucidePlane } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { useClients } from '@/context/ClientsContext'
import ModalPortal from '@/components/ui/ModalPortal'
import type { Client } from '@/types'
import { TEXTS } from '@/constants/text'

type NewDealModalProps = {
    onClose: () => void
    onSuccess: () => void
}

export default function NewDealModal({ onClose, onSuccess }: NewDealModalProps) {
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'client' | 'details'>('client')

    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    const [dealForm, setDealForm] = useState({
        title: '',
        value: '',
        profit: '',
        currency: 'USD',
        type: 'FCL'
    })

    const { deals: dealsApi } = useApi()
    const { clients: searchResults, searchTerm, setSearchTerm, loading: searching } = useClients()

    // No local effect needed as context handles search

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClient) return
        setLoading(true)

        try {
            await dealsApi.create({
                client_id: selectedClient.id,
                title: dealForm.title,
                value: parseFloat(dealForm.value) || 0,
                profit: parseFloat(dealForm.profit) || 0,
                currency: dealForm.currency,
                type: dealForm.type,
                status: 'PENDING'
            })

            onSuccess()
            onClose()

        } catch (error) {
            console.error(error)
            alert('Ocurrió un error. Intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ModalPortal>
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-slate-800">

                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <LucideBriefcase className="text-blue-600 dark:text-blue-400" />
                        {TEXTS.NEW_DEAL}
                    </h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                        <LucideX className="text-gray-500 dark:text-slate-400" size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">{TEXTS.CLIENTS_TITLE}</label>

                        {!selectedClient ? (
                            <div className="relative">
                                <LucideSearch className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" size={18} />
                                <input
                                    type="text"
                                    placeholder={TEXTS.SEARCH_CLIENT}
                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 p-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searching && <LucideLoader2 className="absolute right-3 top-3 animate-spin text-blue-500" size={18} />}

                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {searchResults.map(client => (
                                            <div
                                                key={client.id}
                                                onClick={() => {
                                                    setSelectedClient(client)
                                                    setSearchTerm(client.company_name)
                                                }}
                                                className="p-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 dark:border-slate-700 last:border-0"
                                            >
                                                <div className="font-semibold text-gray-800 dark:text-white">{client.company_name}</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">{client.contact_name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                        {selectedClient.company_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm">{selectedClient.company_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{selectedClient.contact_name}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedClient(null)
                                        setSearchTerm('')
                                    }}
                                    className="text-xs text-red-500 dark:text-red-400 hover:underline font-medium"
                                >
                                    Cambiar
                                </button>
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100 dark:border-slate-800" />

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Título del seguimiento</label>
                            <input
                                required
                                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all"
                                placeholder="Ej. Importación Electrónicos - CN to MX"
                                value={dealForm.title}
                                onChange={e => setDealForm({ ...dealForm, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Valor Estimado</label>
                                <div className="relative">
                                    <LucideDollarSign className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" size={16} />
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 p-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all"
                                        placeholder="0.00"
                                        value={dealForm.value}
                                        onChange={e => setDealForm({ ...dealForm, value: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Profit Estimado</label>
                                <div className="relative">
                                    <LucideDollarSign className="absolute left-3 top-3 text-green-500 dark:text-emerald-400" size={16} />
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 p-3 text-sm text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/20 outline-none transition-all"
                                        placeholder="0.00"
                                        value={dealForm.profit}
                                        onChange={e => setDealForm({ ...dealForm, profit: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Moneda</label>
                                <select
                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all"
                                    value={dealForm.currency}
                                    onChange={e => setDealForm({ ...dealForm, currency: e.target.value })}
                                >
                                    <option value="USD">USD - Dólar</option>
                                    <option value="MXN">MXN - Peso</option>
                                    <option value="EUR">EUR - Euro</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Tipo de Operación</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'FCL', label: 'FCL', icon: LucideContainer },
                                    { id: 'LCL', label: 'LCL', icon: LucideBriefcase },
                                    { id: 'AEREO', label: 'Aéreo', icon: LucidePlane },
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setDealForm({ ...dealForm, type: type.id })}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${dealForm.type === type.id
                                            ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 text-gray-600 dark:text-slate-400'
                                            }`}
                                    >
                                        <type.icon size={20} />
                                        <span className="text-xs font-bold">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedClient || !dealForm.title}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading && <LucideLoader2 className="animate-spin" size={18} />}
                            Crear seguimiento
                        </button>
                    </div>

                </form>
            </div>
        </ModalPortal>
    )
}
