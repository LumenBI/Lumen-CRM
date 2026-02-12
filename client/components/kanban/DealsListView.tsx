'use client'

import { LucidePencil, LucideTrash2, LucideArrowRightCircle } from 'lucide-react'
import type { Deal } from '@/types'
import { getStageLabel, getStageBadgeColor } from '@/constants/stages'
import { TEXTS } from '@/constants/text'

type DealsListViewProps = {
    deals: Deal[]
    onEdit: (deal: Deal) => void
    onMove: (deal: Deal) => void
}

export default function DealsListView({ deals, onEdit, onMove }: DealsListViewProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] uppercase tracking-wider">{TEXTS.CLIENTS_TITLE}</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] uppercase tracking-wider">Título</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] uppercase tracking-wider">Etapa</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-[#000d42] uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {deals.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No hay seguimientos registrados
                                </td>
                            </tr>
                        ) : (
                            deals.map((deal) => (
                                <tr key={deal.id} className="hover:bg-slate-50 transition group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-[#000d42] group-hover:text-[#0056fc] transition-colors">
                                                {deal.client?.company_name || 'Cliente desconocido'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {deal.client?.contact_name}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-700 font-medium">{deal.title}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-slate-700">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency }).format(deal.value)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStageBadgeColor(deal.status)}`}>
                                            {getStageLabel(deal.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
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
