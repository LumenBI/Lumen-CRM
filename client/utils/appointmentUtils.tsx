'use client'

import {
    LucideVideo,
    LucideMapPin,
    LucidePhone,
    LucideClock,
} from 'lucide-react'
import { APPOINTMENT_TYPES, APPOINTMENT_STATUS_MAP } from '@/constants/appointments'

const TYPE_ICON_COMPONENTS: Record<string, typeof LucideVideo> = {
    LucideVideo,
    LucideMapPin,
    LucidePhone,
}

export function getTypeIcon(type: string, size: 'sm' | 'md' = 'sm') {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    const typeConfig = APPOINTMENT_TYPES.find(t => t.id === type)
    const Icon = typeConfig ? TYPE_ICON_COMPONENTS[typeConfig.iconName] || LucideClock : LucideClock
    const colorMap: Record<string, string> = { virtual: 'text-blue-500', presencial: 'text-purple-500', llamada: 'text-green-500' }
    return <Icon className={`${sizeClass} ${colorMap[type] || 'text-gray-500'}`} />
}

export function getStatusBadge(status: string): { className: string; label: string } {
    const config = APPOINTMENT_STATUS_MAP[status]
    if (config) return { className: config.badgeColor, label: config.label }
    return { className: 'bg-orange-100 text-orange-700', label: 'Pendiente' }
}

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
