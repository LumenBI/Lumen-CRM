'use client'

import { useState } from 'react'
import {
    X,
    MessageSquare,
    Phone,
    Mail,
    ArrowRight,
    CheckCircle2,
    CalendarPlus
} from 'lucide-react'

interface StageChangeModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: { interactionType: string, summary: string, nextStep?: string }) => void
    clientName: string
    fromStage: string
    toStage: string
    loading?: boolean
}

type InteractionType = 'CALL' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'OTHER'

const INTERACTION_OPTIONS: { id: InteractionType; label: string; icon: any }[] = [
    { id: 'CALL', label: 'Llamada', icon: Phone },
    { id: 'EMAIL', label: 'Correo', icon: Mail },
    { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
    { id: 'MEETING', label: 'Reunión', icon: CalendarPlus },
]

export default function StageChangeModal({
    isOpen,
    onClose,
    onConfirm,
    clientName,
    fromStage,
    toStage,
    loading = false
}: StageChangeModalProps) {
    const [interactionType, setInteractionType] = useState<InteractionType>('CALL')
    const [summary, setSummary] = useState('')
    const [nextStep, setNextStep] = useState('')

    if (!isOpen) return null

    const handleSubmit = () => {
        if (!summary.trim()) return
        onConfirm({
            interactionType,
            summary,
            nextStep
        })
    }

    return (
        <div className="fixed inset-0 z[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-[#000D42]/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={loading ? undefined : onClose}
            ></div>

            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
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
                    <p className="mt-2 text-sm opacity-90">Cliente: <strong>{clientName}</strong></p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Interaction Type Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            ¿Cómo fue el contacto?
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {INTERACTION_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setInteractionType(option.id)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${interactionType === option.id
                                            ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                                            : 'border-gray-100 hover:border-blue-200 text-gray-600'
                                        }`}
                                >
                                    <option.icon size={20} />
                                    <span className="text-xs font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Resumen de la interacción
                        </label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Ej: Se acordó enviar cotización actualizada..."
                            className="w-full h-24 rounded-xl border border-gray-200 p-3 text-sm focus:border-[#0066FF] focus:ring-4 focus:ring-blue-50 outline-none resize-none"
                        />
                    </div>

                    {/* Next Step Input (Optional) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Próximo paso (Opcional)
                        </label>
                        <input
                            type="text"
                            value={nextStep}
                            onChange={(e) => setNextStep(e.target.value)}
                            placeholder="Ej: Llamar el martes..."
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066FF] focus:ring-4 focus:ring-blue-50 outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!summary.trim() || loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                'Guardando...'
                            ) : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Confirmar Movimiento
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
