import { Container, Briefcase, Plane } from 'lucide-react'

export interface ShippingType {
    id: string
    label: string
    icon: typeof Container
    badgeColor: string
    filterColor: string
}

export const SHIPPING_TYPES: ShippingType[] = [
    { id: 'FCL', label: 'FCL', icon: Container, badgeColor: 'bg-blue-50 text-blue-700', filterColor: 'bg-blue-600' },
    { id: 'LCL', label: 'LCL', icon: Briefcase, badgeColor: 'bg-orange-50 text-orange-700', filterColor: 'bg-orange-500' },
    { id: 'AEREO', label: 'Aéreo', icon: Plane, badgeColor: 'bg-purple-50 text-purple-700', filterColor: 'bg-purple-500' },
]

export const SHIPPING_TYPE_MAP = Object.fromEntries(
    SHIPPING_TYPES.map(t => [t.id, t])
) as Record<string, ShippingType>

export const SHIPPING_TYPE_IDS = ['FCL', 'LCL', 'AEREO'] as const
