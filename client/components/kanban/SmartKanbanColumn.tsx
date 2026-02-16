'use client'

import { useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { Droppable } from '@hello-pangea/dnd'
import { Loader2 } from 'lucide-react'
import KanbanCard from './KanbanCard'
import { useApi } from '@/hooks/useApi'
import { useServerSubscription } from '@/hooks/reactive/useServerSubscription'
import { STAGE_MAP } from '@/constants/stages'

interface SmartKanbanColumnProps {
    id: string
    title: string
    filters: { agentId: string | 'ALL' }
    onEdit: (deal: any) => void
    onContextMenu: (e: any, id: string) => void
}

export default function SmartKanbanColumn({ id, title, filters, onEdit, onContextMenu }: SmartKanbanColumnProps) {
    const { deals: dealsApi } = useApi()
    const { ref, inView } = useInView()

    // 1. Reactividad: Si cambia algo en 'deals', esta columna se entera.
    useServerSubscription('deals', [['kanban-column', id]])

    // 2. Data Fetching Infinito
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey: ['kanban-column', id, filters.agentId],
        queryFn: async ({ pageParam = 0 }) => {
            // Usamos el endpoint paginado
            const res = await dealsApi.getColumna(id, pageParam as number, 20, filters.agentId === 'ALL' ? undefined : filters.agentId)
            return res
        },
        getNextPageParam: (lastPage: any) => lastPage.nextCursor,
        initialPageParam: 0,
        staleTime: 0,
    })

    // 3. Scroll Infinito Automático
    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, fetchNextPage])

    const deals = data?.pages.flatMap((page: any) => page.items) || []
    const stageConfig = STAGE_MAP[id]
    const StageIcon = stageConfig?.icon

    return (
        <div className="w-80 flex-shrink-0 flex flex-col h-full max-h-[calc(100vh-12rem)]">
            {/* Header */}
            <div className={`p-4 rounded-t-xl mb-0 border-b-4 ${stageConfig ? `${stageConfig.headerBg} ${stageConfig.headerBorder} text-white` : 'bg-gray-500 border-gray-600 text-white'} shadow-sm`}>
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                        {StageIcon && <StageIcon size={14} />}
                        {title}
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                        {deals.length}{hasNextPage ? '+' : ''}
                    </span>
                </div>
            </div>

            {/* Área de Drop */}
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
                                // Skeleton simple
                                [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-lg" />)
                            ) : (
                                deals.map((deal: any, index: number) => (
                                    <KanbanCard
                                        key={deal.id}
                                        deal={deal}
                                        index={index}
                                        onEdit={onEdit}
                                        onContextMenu={onContextMenu}
                                    />
                                ))
                            )}
                            {provided.placeholder}

                            {/* Trigger de carga infinita */}
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