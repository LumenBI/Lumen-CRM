'use client'

import {
    LucideVideo,
    LucideMapPin,
    LucidePhone,
    LucideClock,
} from 'lucide-react'

/**
 * Returns the appropriate icon for an appointment type.
 * Consolidates duplicated getTypeIcon from:
 * - AppointmentDetailsModal.tsx
 * - UpcomingAppointmentsWidget.tsx
 * - citas/page.tsx
 */
export function getTypeIcon(type: string, size: 'sm' | 'md' = 'sm') {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

    switch (type) {
        case 'virtual':
            return <LucideVideo className={`${sizeClass} text-blue-500`} />
        case 'presencial':
            return <LucideMapPin className={`${sizeClass} text-purple-500`} />
        case 'llamada':
            return <LucidePhone className={`${sizeClass} text-green-500`} />
        default:
            return <LucideClock className={`${sizeClass} text-gray-500`} />
    }
}

/**
 * Returns status badge styling and label for an appointment status.
 * Consolidates from citas/page.tsx.
 */
export function getStatusBadge(status: string): { className: string; label: string } {
    const config: Record<string, { className: string; label: string }> = {
        pendiente: { className: 'bg-orange-100 text-orange-700', label: 'Pendiente' },
        confirmada: { className: 'bg-green-100 text-green-700', label: 'Confirmada' },
        completada: { className: 'bg-slate-100 text-slate-600', label: 'Completada' },
        cancelada: { className: 'bg-red-100 text-red-700', label: 'Cancelada' },
    }
    return config[status] || config.pendiente
}

/**
 * Formats a date string (YYYY-MM-DD) to a Spanish locale short format.
 * Consolidates duplicated formatDate from:
 * - citas/page.tsx
 * - UpcomingAppointmentsWidget.tsx
 */
export function formatAppointmentDate(dateStr: string): string {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}
