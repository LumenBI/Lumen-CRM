'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom'

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}



export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Eliminar',
    cancelText = 'Cancelar',
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    // Portal logic
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#000D42]/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={isLoading ? undefined : onClose}
            ></div>

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <Trash2 className="h-8 w-8 text-red-600" />
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
                    <p className="mb-6 text-gray-600 text-sm leading-relaxed whitespace-pre-line">{message}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 rounded-xl py-3 px-4 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 rounded-xl py-3 px-4 font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Procesando...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
