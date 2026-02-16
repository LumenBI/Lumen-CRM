'use client'

import { useState } from 'react'
import ModalPortal from '@/components/ui/ModalPortal'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface RejectionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    isLoading?: boolean
}

export default function RejectionModal({ isOpen, onClose, onConfirm, isLoading = false }: RejectionModalProps) {
    const [reason, setReason] = useState('')

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason.trim()) return
        onConfirm(reason)
    }

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/30 animate-in zoom-in-95 duration-200">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rechazar Prospecto</h3>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                            Por favor indica el motivo por el cual estás rechazando esta oportunidad. Esta información es útil para futuros análisis.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <textarea
                                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/20 min-h-[100px] mb-4"
                                placeholder="Motivo del rechazo..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                autoFocus
                                required
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!reason.trim() || isLoading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    {isLoading && <Loader2 className="animate-spin" size={16} />}
                                    Rechazar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}
