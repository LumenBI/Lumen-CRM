'use client'

import React from 'react'
import { useRef } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { CalendarClock, Pencil, Check, X } from 'lucide-react'
import type { Deal } from '@/types'
import { useUser } from '@/context/UserContext'

interface KanbanCardProps {
    deal: Deal
    index: number
    onEdit: (deal: Deal) => void
    onContextMenu: (e: React.MouseEvent, dealId: string) => void
    onApprove: (dealId: string) => void
    onReject: (dealId: string) => void
    onDetail?: (deal: Deal) => void
    /** Render metadata extra específico de la industria debajo del título. */
    renderCustomMetadata?: (deal: Deal) => React.ReactNode
}

const KanbanCard = React.memo(({ deal, index, onEdit, onContextMenu, onApprove, onReject, onDetail, renderCustomMetadata }: KanbanCardProps) => {
    const { profile } = useUser()
    const isManagerOrAdmin = profile?.role === 'ADMIN' || profile?.role === 'MANAGER'
    const isProspect = deal.status === 'PROSPECT'
    const mouseDownPos = useRef({ x: 0, y: 0 })

    const handleMouseDown = (e: React.MouseEvent) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = (e: React.MouseEvent) => {
        // Ensure it's a left click (button 0) to avoid conflict with right-click context menu
        if (e.button !== 0) return

        const dx = Math.abs(e.clientX - mouseDownPos.current.x)
        const dy = Math.abs(e.clientY - mouseDownPos.current.y)
        // If movement is less than 5 pixels, consider it a click
        if (dx < 5 && dy < 5) {
            onDetail?.(deal)
        }
    }

    return (
        <Draggable draggableId={deal.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onContextMenu={(e) => onContextMenu(e, deal.id)}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm group hover:shadow-md transition-all relative cursor-pointer ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-blue-500 z-50' : 'border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                        }`}
                    style={provided.draggableProps.style}
                >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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

                    {/* Metadata personalizada inyectada por la capa superior (agnóstica de industria) */}
                    {renderCustomMetadata && (
                        <div className="mb-3">
                            {renderCustomMetadata(deal)}
                        </div>
                    )}

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

                    {deal.value > 0 ? (
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
                    ) : (
                        <div className="pt-3 border-t border-gray-50 dark:border-slate-700 min-h-[20px]">
                            {/* Empty space or placeholder if needed */}
                        </div>
                    )}

                    {/* Approve/Reject Buttons for Prospects */}
                    {isProspect && isManagerOrAdmin && (
                        <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onApprove(deal.id)
                                }}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold transition-colors"
                            >
                                <Check size={14} /> Aprobar
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onReject(deal.id)
                                }}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors"
                            >
                                <X size={14} /> Rechazar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    )
})

KanbanCard.displayName = 'KanbanCard'

export default KanbanCard
