'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LucideX, LucideLoader2, LucideSearch, LucideCheck, LucideDollarSign, LucideBriefcase, LucideContainer, LucidePlane } from 'lucide-react'

type NewDealModalProps = {
    onClose: () => void
    onSuccess: () => void
}

type Client = {
    id: string
    company_name: string
    contact_name: string
    email: string
}

export default function NewDealModal({ onClose, onSuccess }: NewDealModalProps) {
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'client' | 'details'>('client')

    // Client Search State
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [searching, setSearching] = useState(false)

    // Deal Form State
    const [dealForm, setDealForm] = useState({
        title: '',
        value: '',
        profit: '',
        currency: 'USD',
        type: 'FCL'
    })

    const supabase = createClient()

    // Search Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 1 && !selectedClient) {
                setSearching(true)
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients?query=${searchTerm}`, {
                            headers: { Authorization: `Bearer ${session.access_token}` }
                        })
                        if (res.ok) {
                            const data = await res.json()
                            setSearchResults(data)
                        }
                    } catch (e) {
                        console.error(e)
                    } finally {
                        setSearching(false)
                    }
                }
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm, selectedClient])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClient) return
        setLoading(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/deals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    client_id: selectedClient.id,
                    title: dealForm.title,
                    value: parseFloat(dealForm.value) || 0,
                    profit: parseFloat(dealForm.profit) || 0,
                    currency: dealForm.currency,
                    type: dealForm.type,
                    status: 'CONTACTADO'
                })
            })

            if (!res.ok) throw new Error('Error creando negociación')

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <LucideBriefcase className="text-blue-600" />
                        Nueva Negociación
                    </h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200 transaction-colors">
                        <LucideX className="text-gray-500" size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* 1. Select Client */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Cliente</label>

                        {!selectedClient ? (
                            <div className="relative">
                                <LucideSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar empresa..."
                                    className="w-full rounded-xl border border-gray-200 pl-10 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searching && <LucideLoader2 className="absolute right-3 top-3 animate-spin text-blue-500" size={18} />}

                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {searchResults.map(client => (
                                            <div
                                                key={client.id}
                                                onClick={() => {
                                                    setSelectedClient(client)
                                                    setSearchTerm(client.company_name)
                                                    setSearchResults([])
                                                }}
                                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                            >
                                                <div className="font-semibold text-gray-800">{client.company_name}</div>
                                                <div className="text-xs text-gray-500">{client.contact_name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {selectedClient.company_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{selectedClient.company_name}</p>
                                        <p className="text-xs text-gray-500">{selectedClient.contact_name}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedClient(null)
                                        setSearchTerm('')
                                    }}
                                    className="text-xs text-red-500 hover:underline font-medium"
                                >
                                    Cambiar
                                </button>
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100" />

                    {/* 2. Deal Details */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Título de la Negociación</label>
                            <input
                                required
                                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                placeholder="Ej. Importación Electrónicos - CN to MX"
                                value={dealForm.title}
                                onChange={e => setDealForm({ ...dealForm, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Valor Estimado</label>
                                <div className="relative">
                                    <LucideDollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full rounded-xl border border-gray-200 pl-9 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholder="0.00"
                                        value={dealForm.value}
                                        onChange={e => setDealForm({ ...dealForm, value: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Profit Estimado</label>
                                <div className="relative">
                                    <LucideDollarSign className="absolute left-3 top-3 text-green-500" size={16} />
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full rounded-xl border border-gray-200 pl-9 p-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                        placeholder="0.00"
                                        value={dealForm.profit}
                                        onChange={e => setDealForm({ ...dealForm, profit: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Moneda</label>
                                <select
                                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
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
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Tipo de Operación</label>
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
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-blue-200 text-gray-600'
                                            }`}
                                    >
                                        <type.icon size={20} />
                                        <span className="text-xs font-bold">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedClient || !dealForm.title}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading && <LucideLoader2 className="animate-spin" size={18} />}
                            Crear Negociación
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
