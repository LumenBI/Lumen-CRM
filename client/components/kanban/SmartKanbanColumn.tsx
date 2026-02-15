'use client'

import React, { useRef, useEffect } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import { useServerSubscription } from '@/hooks/reactive/useServerSubscription'
import KanbanCard from './KanbanCard'
import { Loader2 } from 'lucide-react'
import type { Deal } from '@/types'

interface SmartKanbanColumnProps {
    stageId: string
    title: string
    onEditDeal: (deal: Deal) => void
    onOpenContextMenu: (e: React.MouseEvent, dealId: string) => void
}

const SmartKanbanColumn: React.FC<SmartKanbanColumnProps> = ({
    stageId,
    title,
    onEditDeal,
    onOpenContextMenu
}) => {
    const { deals: dealsApi } = useApi()
    const loadMoreRef = useRef<HTMLDivElement>(null)

    // Specific subscription for this column
    useServerSubscription('deals', [['deals', 'column', stageId]])

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['deals', 'column', stageId],
        queryFn: ({ pageParam }) => dealsApi.getColumna(stageId, pageParam as string | undefined, 20),
        getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
        initialPageParam: undefined,
        staleTime: 5000,
    })

    useEffect(() => {
        if (!hasNextPage || isFetchingNextPage) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage()
                }
            },
            { threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current)
        }

        return () => observer.disconnect()
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const allDeals = data?.pages.flatMap((page: any) => page.items) || []

    return (
        <div className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#000d42] dark:text-gray-200 uppercase tracking-wider text-xs">{title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-[10px] font-bold">
                        {isLoading ? '...' : allDeals.length}
                    </span>
                </div>
            </div>

            <Droppable droppableId={stageId}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <Loader2 className="animate-spin text-blue-600 mb-2" size={24} />
                                <p className="text-xs font-medium text-gray-400">Cargando...</p>
                            </div>
                        ) : allDeals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                <p className="text-xs font-medium text-gray-400 italic">Sin movimientos</p>
                            </div>
                        ) : (
                            allDeals.map((deal: Deal, index: number) => (
                                <KanbanCard
                                    key={deal.id}
                                    deal={deal}
                                    index={index}
                                    onEdit={onEditDeal}
                                    onContextMenu={(e) => onOpenContextMenu(e, deal.id)}
                                />
                            ))
                        )}
                        {provided.placeholder}

                        {/* Infinite Scroll Trigger */}
                        <div ref={loadMoreRef} className="h-4 flex items-center justify-center">
                            {isFetchingNextPage && <Loader2 className="animate-spin text-blue-400" size={16} />}
                        </div>
                    </div>
                )}
            </Droppable>
        </div>
    )
}

export default SmartKanbanColumn
