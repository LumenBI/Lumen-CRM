'use client'

import { LucidePencil, LucideTrash2, LucideArrowRightCircle } from 'lucide-react'
import type { Deal } from '@/types'
import { getStageLabel, getStageBadgeColor } from '@/constants/stages'
import { TEXTS } from '@/constants/text'

type DealsListViewProps = {
    deals: Deal[]
    onEdit: (deal: Deal) => void
    onMove: (deal: Deal) => void
    onDelete?: (deal: Deal) => void
    onContextMenu?: (e: React.MouseEvent, dealId: string) => void
    onDetail?: (deal: Deal) => void
}

export default function DealsListView({ deals, onEdit, onMove, onDelete, onContextMenu, onDetail }: DealsListViewProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300">
            {/* Vista cards - móvil */}
            <div className="md:hidden p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-20rem)] scrollbar-thin">
                {deals.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                        No hay seguimientos registrados
                    </div>
                ) : (
                    deals.map((deal) => (
                        <div
                            key={deal.id}
                            className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            onContextMenu={(e) => onContextMenu?.(e, deal.id)}
                            onClick={(e) => {
                                if (e.button === 0) onDetail?.(deal)
                            }}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                    <p className="font-bold text-[#000d42] dark:text-white truncate">
                                        {deal.client?.company_name || 'Cliente desconocido'}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {deal.client?.contact_name}
                                    </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStageBadgeColor(deal.status)} shadow-sm`}>
                                    {getStageLabel(deal.status)}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-2 line-clamp-2">{deal.title}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency }).format(deal.value)}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onEdit(deal)
                                        }}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                        title="Editar seguimiento"
                                    >
                                        <LucidePencil size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onMove(deal)
                                        }}
                                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg"
                                        title="Mover etapa"
                                    >
                                        <LucideArrowRightCircle size={18} />
                                    </button>
                                    {onDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(deal)
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                            title="Eliminar"
                                        >
                                            <LucideTrash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Vista tabla - desktop */}
            <div className="hidden md:block overflow-hidden">
                <div className="overflow-y-auto max-h-[calc(100vh-20rem)] scrollbar-thin">
                    <table className="w-full">
                        <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">{TEXTS.CLIENTS_TITLE}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Título</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Etapa</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {deals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No hay seguimientos registrados
                                    </td>
                                </tr>
                            ) : (
                                deals.map((deal) => (
                                    <tr
                                        key={deal.id}
                                        className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition group border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                                        onContextMenu={(e) => onContextMenu?.(e, deal.id)}
                                        onClick={(e) => {
                                            if (e.button === 0) onDetail?.(deal)
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-[#000d42] dark:text-white group-hover:text-[#0056fc] dark:group-hover:text-blue-400 transition-colors">
                                                    {deal.client?.company_name || 'Cliente desconocido'}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {deal.client?.contact_name}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{deal.title}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency }).format(deal.value)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStageBadgeColor(deal.status)} shadow-sm`}>
                                                {getStageLabel(deal.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onEdit(deal)
                                                    }}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Editar seguimiento"
                                                >
                                                    <LucidePencil size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onMove(deal)
                                                    }}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                                    title="Mover etapa"
                                                >
                                                    <LucideArrowRightCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onDelete?.(deal)
                                                    }}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <LucideTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
