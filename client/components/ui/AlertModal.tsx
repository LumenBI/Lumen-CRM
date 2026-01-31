'use client';

import React from 'react';
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: AlertType;
}

const TYPE_CONFIG = {
    success: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-100',
        gradient: 'from-green-400 to-green-600',
        button: 'bg-green-600 hover:bg-green-700',
    },
    error: {
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-100',
        gradient: 'from-red-400 to-red-600',
        button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        gradient: 'from-yellow-400 to-yellow-600',
        button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
        icon: Info,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        gradient: 'from-blue-400 to-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
    },
};

export default function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
    if (!isOpen) return null;

    const config = TYPE_CONFIG[type];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#000D42]/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.bg}`}>
                        <Icon className={`h-8 w-8 ${config.color}`} />
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
                    <p className="mb-6 text-gray-600 text-sm leading-relaxed whitespace-pre-line">{message}</p>

                    <button
                        onClick={onClose}
                        className={`w-full rounded-xl py-3 px-4 font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl ${config.button}`}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
