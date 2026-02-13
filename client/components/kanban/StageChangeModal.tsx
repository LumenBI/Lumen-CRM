'use client'

import { useState, useEffect } from 'react'
import {
    X,
    MessageSquare,
    Phone,
    Mail,
    ArrowRight,
    CheckCircle2,
    CalendarPlus
} from 'lucide-react'

export const STAGE_ID_COTIZANDO = 'PROCESO_COTIZACION'

interface StageChangeModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: { interactionType: string, summary: string, nextStep?: string }, options?: { prepareQuote?: boolean }) => void
    dealTitle: string
    fromStage: string
    toStage: string
    toStageId?: string
    loading?: boolean
}

type InteractionType = 'CALL' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'OTHER'

const INTERACTION_OPTIONS: { id: InteractionType; label: string; icon: any }[] = [
    { id: 'CALL', label: 'Llamada', icon: Phone },
    { id: 'EMAIL', label: 'Correo', icon: Mail },
    { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
    { id: 'MEETING', label: 'Reunión', icon: CalendarPlus },
]

import { createPortal } from 'react-dom'

export default function StageChangeModal({
    isOpen,
    onClose,
    onConfirm,
    dealTitle,
    fromStage,
    toStage,
    toStageId,
    loading = false
}: StageChangeModalProps) {
    const [interactionType, setInteractionType] = useState<InteractionType>('CALL')
    const [summary, setSummary] = useState('')
    const [nextStep, setNextStep] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen) return null

    const isMovingToCotizando = toStageId === STAGE_ID_COTIZANDO
    const interactionData = { interactionType, summary, nextStep }

    const handleSubmit = (prepareQuote?: boolean) => {
        if (!summary.trim()) return
        onConfirm(interactionData, isMovingToCotizando ? { prepareQuote } : undefined)
    }

    if (!mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-[#000D42]/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={loading ? undefined : onClose}
            ></div>

            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800">
                <div className="bg-gradient-to-r from-[#000D42] to-[#0066FF] p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">Registrar Avance</h3>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                        <span>{fromStage}</span>
                        <ArrowRight size={16} />
                        <span className="font-bold text-white">{toStage}</span>
                    </div>
                    <p className="mt-2 text-sm opacity-90">Seguimiento: <strong>{dealTitle}</strong></p>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                            ¿Cómo fue el contacto?
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {INTERACTION_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setInteractionType(option.id)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${interactionType === option.id
                                        ? 'border-[#0066FF] dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-[#0066FF] dark:text-blue-400'
                                        : 'border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 text-gray-600 dark:text-slate-400'
                                        }`}
                                >
                                    <option.icon size={20} />
                                    <span className="text-xs font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Resumen de la interacción
                        </label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Ej: Se acordó enviar cotización actualizada..."
                            className="w-full h-24 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-gray-900 dark:text-white focus:border-[#0066FF] focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/10 outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Próximo paso (Opcional)
                        </label>
                        <input
                            type="text"
                            value={nextStep}
                            onChange={(e) => setNextStep(e.target.value)}
                            placeholder="Ej: Llamar el martes..."
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-[#0066FF] focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/10 outline-none"
                        />
                    </div>

                    <div className="pt-2 space-y-2">
                        {isMovingToCotizando ? (
                            <>
                                <p className="text-sm font-medium text-gray-600 dark:text-slate-400 text-center">¿Deseas preparar una cotización ahora?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleSubmit(false)}
                                        disabled={!summary.trim() || loading}
                                        className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        No, solo mover
                                    </button>
                                    <button
                                        onClick={() => handleSubmit(true)}
                                        disabled={!summary.trim() || loading}
                                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Guardando...' : (
                                            <>
                                                <CheckCircle2 size={18} />
                                                Mover y preparar cotización
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => handleSubmit()}
                                disabled={!summary.trim() || loading}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Guardando...' : (
                                    <>
                                        <CheckCircle2 size={20} />
                                        Confirmar Movimiento
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
