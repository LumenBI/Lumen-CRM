export interface AppointmentStatus {
    id: string
    label: string
    badgeColor: string
    calendarColor: string
}

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
    { id: 'pendiente', label: 'Pendiente', badgeColor: 'bg-orange-100 text-orange-700', calendarColor: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'confirmada', label: 'Confirmada', badgeColor: 'bg-green-100 text-green-700', calendarColor: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'completada', label: 'Completada', badgeColor: 'bg-slate-100 text-slate-600', calendarColor: 'bg-gray-100 text-gray-700 border-gray-200' },
    { id: 'cancelada', label: 'Cancelada', badgeColor: 'bg-red-100 text-red-700', calendarColor: 'bg-red-100 text-red-700 border-red-200' },
]

export const APPOINTMENT_STATUS_MAP = Object.fromEntries(
    APPOINTMENT_STATUSES.map(s => [s.id, s])
) as Record<string, AppointmentStatus>

export const APPOINTMENT_STATUS_IDS = ['pendiente', 'confirmada', 'completada', 'cancelada'] as const

export interface AppointmentType {
    id: string
    label: string
    iconName: 'LucideVideo' | 'LucideMapPin' | 'LucidePhone'
}

export const APPOINTMENT_TYPES: AppointmentType[] = [
    { id: 'virtual', label: 'Virtual', iconName: 'LucideVideo' },
    { id: 'presencial', label: 'Presencial', iconName: 'LucideMapPin' },
    { id: 'llamada', label: 'Llamada', iconName: 'LucidePhone' },
]

export const APPOINTMENT_TYPE_IDS = ['virtual', 'presencial', 'llamada'] as const

export function getStatusBadgeColor(status: string): string {
    return APPOINTMENT_STATUS_MAP[status]?.badgeColor || 'bg-gray-100 text-gray-600'
}

export function getStatusCalendarColor(status: string): string {
    return APPOINTMENT_STATUS_MAP[status]?.calendarColor || 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getStatusLabel(status: string): string {
    return APPOINTMENT_STATUS_MAP[status]?.label || status
}

export const APPOINTMENT_TYPE_MAP = Object.fromEntries(
    APPOINTMENT_TYPES.map(t => [t.id, t])
) as Record<string, AppointmentType>

export function getTypeLabel(typeId: string): string {
    return APPOINTMENT_TYPE_MAP[typeId]?.label || typeId
}
