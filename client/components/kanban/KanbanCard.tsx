'use client'

import React from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { CalendarClock, Pencil } from 'lucide-react'
import type { Deal } from '@/types'
import { SHIPPING_TYPE_MAP } from '@/constants/shipping'

interface KanbanCardProps {
    deal: Deal
    index: number
    onEdit: (deal: Deal) => void
    onContextMenu: (e: React.MouseEvent, dealId: string) => void
}

const KanbanCard = React.memo(({ deal, index, onEdit, onContextMenu }: KanbanCardProps) => {
    return (
        <Draggable draggableId={deal.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onContextMenu={(e) => onContextMenu(e, deal.id)}
                    className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm group hover:shadow-md transition-all relative ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-blue-500 z-50' : 'border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                        }`}
                    style={provided.draggableProps.style}
                >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit(deal)
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                            <Pencil size={14} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="mb-3">
                        {(() => {
                            const shipConfig = SHIPPING_TYPE_MAP[deal.type]
                            const ShipIcon = shipConfig?.icon
                            return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${shipConfig?.badgeColor || 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-300'}`}>
                                    {ShipIcon && <ShipIcon size={10} />}
                                    {shipConfig?.label || deal.type}
                                </span>
                            )
                        })()}
                    </div>

                    <h4 className="font-bold text-gray-800 dark:text-slate-100 text-sm mb-1 line-clamp-2 leading-relaxed">
                        {deal.title}
                    </h4>

                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                            {deal.client?.company_name?.substring(0, 1) || '?'}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-medium truncate max-w-[180px]">
                            {deal.client?.company_name}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-700">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD', maximumFractionDigits: 0 }).format(deal.value || 0)}
                        </span>
                        {deal.expected_close_date && (
                            <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700/50 px-2 py-1 rounded-full">
                                <CalendarClock size={12} />
                                {new Date(deal.expected_close_date).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    )
})

KanbanCard.displayName = 'KanbanCard'

export default KanbanCard
