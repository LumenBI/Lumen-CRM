'use client'

import { LucideAlertCircle, LucideX, LucideLoader2 } from 'lucide-react'
import ModalPortal from './ModalPortal'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isDestructive?: boolean
    isLoading?: boolean
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = true,
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                    <div className="p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className={`p-4 rounded-full ${isDestructive ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400'}`}>
                                <LucideAlertCircle size={32} />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-[#000d42] dark:text-white mb-2">{title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                            {message}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-900/20'
                                    }`}
                            >
                                {isLoading && <LucideLoader2 size={18} className="animate-spin" />}
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}
