import {
    ClipboardList,
    PhoneCall,
    Briefcase,
    FileText,
    CheckCircle2,
    XCircle,
} from 'lucide-react'

export interface Stage {
    id: string
    title: string
    badgeColor: string
    headerBg: string
    headerBorder: string
    chartColor: string
    icon: typeof ClipboardList
}

export const STAGES: Stage[] = [
    {
        id: 'PROSPECT',
        title: 'Prospecto',
        badgeColor: 'bg-indigo-100 text-indigo-600',
        headerBg: 'bg-indigo-500',
        headerBorder: 'border-indigo-600',
        chartColor: '#6366f1',
        icon: Briefcase,
    },
    {
        id: 'PENDING',
        title: 'No contactado',
        badgeColor: 'bg-gray-100 text-gray-600',
        headerBg: 'bg-gray-500',
        headerBorder: 'border-gray-600',
        chartColor: '#6b7280',
        icon: ClipboardList,
    },
    {
        id: 'CONTACTADO',
        title: 'Contactado',
        badgeColor: 'bg-blue-100 text-blue-600',
        headerBg: 'bg-slate-600',
        headerBorder: 'border-slate-700',
        chartColor: '#3b82f6',
        icon: ClipboardList,
    },
    {
        id: 'CITA',
        title: 'Cita / Reunión',
        badgeColor: 'bg-purple-100 text-purple-600',
        headerBg: 'bg-blue-600',
        headerBorder: 'border-blue-700',
        chartColor: '#8b5cf6',
        icon: PhoneCall,
    },
    {
        id: 'PROCESO_COTIZACION',
        title: 'Cotizando',
        badgeColor: 'bg-orange-100 text-orange-600',
        headerBg: 'bg-orange-500',
        headerBorder: 'border-orange-600',
        chartColor: '#f97316',
        icon: Briefcase,
    },
    {
        id: 'COTIZACION_ENVIADA',
        title: 'Cotización enviada',
        badgeColor: 'bg-yellow-100 text-yellow-700',
        headerBg: 'bg-purple-600',
        headerBorder: 'border-purple-700',
        chartColor: '#eab308',
        icon: FileText,
    },
    {
        id: 'CERRADO_GANADO',
        title: 'Cerrado ganado',
        badgeColor: 'bg-green-100 text-green-600',
        headerBg: 'bg-green-600',
        headerBorder: 'border-green-700',
        chartColor: '#22c55e',
        icon: CheckCircle2,
    },
    {
        id: 'CERRADO_PERDIDO',
        title: 'Perdido',
        badgeColor: 'bg-red-100 text-red-600',
        headerBg: 'bg-red-500',
        headerBorder: 'border-red-600',
        chartColor: '#ef4444',
        icon: XCircle,
    },
]

// Lookup helpers
export const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s])) as Record<string, Stage>

export const STAGE_IDS = ['PROSPECT', 'PENDING', 'CONTACTADO', 'CITA', 'PROCESO_COTIZACION', 'COTIZACION_ENVIADA', 'CERRADO_GANADO', 'CERRADO_PERDIDO'] as const

export function getStageLabel(stageId: string): string {
    return STAGE_MAP[stageId]?.title || stageId
}

export function getStageBadgeColor(stageId: string): string {
    return STAGE_MAP[stageId]?.badgeColor || 'bg-gray-50 text-gray-500'
}
