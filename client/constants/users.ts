export interface UserStatus {
    id: string
    label: string
    badgeColor: string
    dotColor: string
}

export const USER_STATUSES: UserStatus[] = [
    { id: 'ACTIVE', label: 'Activo', badgeColor: 'bg-gradient-to-r from-emerald-100 to-green-100 text-green-700', dotColor: 'bg-green-500 animate-pulse' },
    { id: 'INACTIVE', label: 'Inactivo', badgeColor: 'bg-gradient-to-r from-red-100 to-red-200 text-red-700', dotColor: 'bg-red-500' },
    { id: 'PENDING', label: 'Pendiente', badgeColor: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700', dotColor: 'bg-amber-500' },
]

export const USER_STATUS_MAP = Object.fromEntries(
    USER_STATUSES.map(s => [s.id, s])
) as Record<string, UserStatus>

export type UserStatusId = 'ACTIVE' | 'INACTIVE' | 'PENDING'

export function getUserStatusLabel(status: string): string {
    return USER_STATUS_MAP[status]?.label || status
}

export function getUserStatusBadgeColor(status: string): string {
    return USER_STATUS_MAP[status]?.badgeColor || 'bg-gray-100 text-gray-600'
}

export function getUserStatusDotColor(status: string): string {
    return USER_STATUS_MAP[status]?.dotColor || 'bg-gray-400'
}
