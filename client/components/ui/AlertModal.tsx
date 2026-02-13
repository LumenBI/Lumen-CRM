'use client'

export type AlertType = 'info' | 'success' | 'warning' | 'error'

import { LucideInfo, LucideCheckCircle, LucideAlertTriangle, LucideX } from 'lucide-react'
import ModalPortal from './ModalPortal'

interface AlertModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    type?: AlertType
}

export default function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info'
}: AlertModalProps) {
    if (!isOpen) return null

    const typeConfig = {
        info: {
            icon: LucideInfo,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            button: 'bg-blue-600 hover:bg-blue-700'
        },
        success: {
            icon: LucideCheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
            button: 'bg-green-600 hover:bg-green-700'
        },
        warning: {
            icon: LucideAlertTriangle,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            border: 'border-yellow-100',
            button: 'bg-yellow-600 hover:bg-yellow-700'
        },
        error: {
            icon: LucideAlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            button: 'bg-red-600 hover:bg-red-700'
        }
    }

    const { icon: Icon, color, bg, border, button } = typeConfig[type]

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${bg} ${color} dark:bg-opacity-10 dark:text-opacity-90`}>
                                <Icon size={24} />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500"
                            >
                                <LucideX size={20} />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-[#000d42] dark:text-white mb-2">{title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            {message}
                        </p>

                        <div className="mt-6">
                            <button
                                onClick={onClose}
                                className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 ${button}`}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}
