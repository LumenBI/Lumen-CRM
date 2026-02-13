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
}

export default function DealsListView({ deals, onEdit, onMove, onDelete }: DealsListViewProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">{TEXTS.CLIENTS_TITLE}</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Título</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Etapa</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {deals.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                    No hay seguimientos registrados
                                </td>
                            </tr>
                        ) : (
                            deals.map((deal) => (
                                <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition group border-b border-slate-100 dark:border-slate-800">
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
                                                onClick={() => onEdit(deal)}
                                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Editar seguimiento"
                                            >
                                                <LucidePencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => onMove(deal)}
                                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                                title="Mover etapa"
                                            >
                                                <LucideArrowRightCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDelete?.(deal)}
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
    )
}
