'use client'

import { useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { Droppable } from '@hello-pangea/dnd'
import { Loader2 } from 'lucide-react'
import KanbanCard from './KanbanCard'
import { useApi } from '@/hooks/useApi'
import { STAGE_MAP } from '@/constants/stages'

interface SmartKanbanColumnProps {
    id: string
    title: string
    stageId?: string
    filters?: { agentId: string | 'ALL' }
    onEditDeal?: (deal: any) => void
    onContextMenu?: (e: any, id: string) => void
    onApprove: (dealId: string) => void
    onReject: (dealId: string) => void
    onDetail?: (deal: any) => void
}

export default function SmartKanbanColumn(props: SmartKanbanColumnProps) {
    const id = props.id || props.stageId || ''
    const onEdit = props.onEditDeal || (() => { })
    const onContextMenu = props.onContextMenu || (() => { })
    const { onApprove, onReject, onDetail } = props
    const filters = props.filters || { agentId: 'ALL' }

    const { deals: dealsApi } = useApi()
    const { ref, inView } = useInView()



    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey: ['kanban-column', id, filters.agentId],
        queryFn: async ({ pageParam = 0 }) => {
            const cursorVal = typeof pageParam === 'number' ? pageParam : 0
            return await dealsApi.getColumna(id, cursorVal, 20, filters.agentId === 'ALL' ? undefined : filters.agentId)
        },
        getNextPageParam: (lastPage: any) => lastPage.nextCursor,
        initialPageParam: 0,
        staleTime: 0,
    })

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, fetchNextPage])

    const deals = useMemo(() => {
        const allDeals = data?.pages.flatMap((page: any) => page.items) || []
        // Deduplicate using Map
        const uniqueMap = new Map()
        allDeals.forEach((deal: any) => {
            uniqueMap.set(deal.id, deal)
        })
        return Array.from(uniqueMap.values())
    }, [data])
    const stageConfig = STAGE_MAP[id]
    const StageIcon = stageConfig?.icon

    return (
        <div className="w-80 flex-shrink-0 flex flex-col h-full bg-slate-50/40 dark:bg-slate-900/40 rounded-xl max-h-[calc(100vh-12rem)] shadow-sm">
            <div className={`p-4 rounded-t-xl mb-0 border-b-4 ${stageConfig ? `${stageConfig.headerBg} ${stageConfig.headerBorder} text-white` : 'bg-gray-500 border-gray-600 text-white'}`}>
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                        {StageIcon && <StageIcon size={14} />}
                        {props.title}
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                        {deals.length}{hasNextPage ? '+' : ''}
                    </span>
                </div>
            </div>

            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-2 bg-gray-50/50 dark:bg-slate-900/20 rounded-b-xl border border-gray-100 dark:border-slate-800 overflow-y-auto transition-colors scrollbar-thin ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-100 dark:ring-blue-900 ring-inset' : ''
                            }`}
                    >
                        <div className="space-y-3">
                            {status === 'pending' ? (
                                [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-lg" />)
                            ) : (
                                deals.map((deal: any, index: number) => (
                                    <KanbanCard
                                        key={deal.id}
                                        deal={deal}
                                        index={index}
                                        onEdit={onEdit}
                                        onContextMenu={onContextMenu}
                                        onApprove={onApprove}
                                        onReject={onReject}
                                        onDetail={onDetail}
                                    />
                                ))
                            )}
                            {provided.placeholder}

                            <div ref={ref} className="h-4 w-full flex justify-center py-2">
                                {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>
                        </div>
                    </div>
                )}
            </Droppable>
        </div>
    )
}