import { Box, Tag, Zap } from 'lucide-react'

/**
 * DealType — Tipo genérico de trato.
 * Las keys coinciden con los valores almacenados en Supabase (Capa Anticorrupción, Fase 1).
 * En Fase 2, el `deal-adapter.ts` hará la traducción bidireccional hacia IDs neutros.
 */
export interface DealType {
    id: string
    label: string
    icon: typeof Box
    badgeColor: string
    filterColor: string
}

export const DEAL_TYPES: DealType[] = [
    { id: 'FCL',   label: 'Tipo Estándar',     icon: Box,  badgeColor: 'bg-blue-50 text-blue-700',   filterColor: 'bg-blue-600' },
    { id: 'LCL',   label: 'Tipo Consolidado',  icon: Tag,  badgeColor: 'bg-orange-50 text-orange-700', filterColor: 'bg-orange-500' },
    { id: 'AEREO', label: 'Tipo Express',       icon: Zap,  badgeColor: 'bg-purple-50 text-purple-700', filterColor: 'bg-purple-500' },
]

/**
 * Mapa de tipos de trato indexado por su key.
 * Nota: Las keys (FCL, LCL, AEREO) son las mismas que en la DB — NO cambiar en Fase 1.
 */
export const DEAL_TYPE_MAP = Object.fromEntries(
    DEAL_TYPES.map(t => [t.id, t])
) as Record<string, DealType>

export const DEAL_TYPE_IDS = ['FCL', 'LCL', 'AEREO'] as const
