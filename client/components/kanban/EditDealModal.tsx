'use client'

import { useState } from 'react'
import { LucideX, LucideSave, LucideLoader2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { Deal } from '@/types'
import { toast } from 'sonner'

type EditDealModalProps = {
    deal: Deal
    onClose: () => void
    onSuccess: () => void
}

export default function EditDealModal({ deal, onClose, onSuccess }: EditDealModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: deal.title,
        value: deal.value.toString(),
        type: deal.type,
        currency: deal.currency
    })

    const { deals } = useApi()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await deals.update(deal.id, {
                title: formData.title,
                value: parseFloat(formData.value) || 0,
                type: formData.type as any,
                currency: formData.currency
            })
            onSuccess()
        } catch (error) {
            console.error('Error updating deal:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-[#000d42]">Editar Seguimiento</h2>
                        <p className="text-sm text-slate-500">{deal.client?.company_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <LucideX size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Título</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056fc] focus:ring-2 focus:ring-[#0056fc]/20 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Valor</label>
                            <input
                                type="number"
                                required
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056fc] focus:ring-2 focus:ring-[#0056fc]/20 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Moneda</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056fc] focus:ring-2 focus:ring-[#0056fc]/20 outline-none transition-all"
                            >
                                <option value="USD">USD</option>
                                <option value="MXN">MXN</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Tipo de Servicio</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056fc] focus:ring-2 focus:ring-[#0056fc]/20 outline-none transition-all"
                        >
                            <option value="FCL">FCL - Contenedor</option>
                            <option value="LCL">LCL - Carga Suelta</option>
                            <option value="AEREO">Aéreo</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-[#000d42] text-white rounded-xl font-semibold hover:bg-[#000d42]/90 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <LucideLoader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <LucideSave size={18} />
                                    Guardar cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
