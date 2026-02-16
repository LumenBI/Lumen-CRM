'use client'

import { useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { useApi } from '@/hooks/useApi'
import KanbanCard from './KanbanCard'
import { Loader2 } from 'lucide-react'
import { Droppable } from '@hello-pangea/dnd'
import { STAGE_MAP } from '@/constants/stages'
import { Deal } from '@/types'

interface SmartKanbanColumnProps {
    stageId: string
    title: string
    onEditDeal: (deal: Deal) => void
    onOpenContextMenu: (e: React.MouseEvent, dealId: string) => void
}

export default function SmartKanbanColumn({
    stageId,
    title,
    onEditDeal,
    onOpenContextMenu
}: SmartKanbanColumnProps) {
    const { deals: dealsApi } = useApi()
    const { ref, inView } = useInView()
    const stage = STAGE_MAP[stageId]

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey: ['deals', 'column', stageId],
        queryFn: ({ pageParam }) => dealsApi.getColumna(stageId, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    })

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const deals = data?.pages.flatMap((page) => page.items) || []

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-border/40 min-w-[320px] overflow-hidden shadow-sm">
            {/* Colored Header */}
            <div className={`p-4 flex items-center justify-between border-b shadow-sm ${stage?.headerBg || 'bg-slate-600'} ${stage?.headerBorder || 'border-slate-700'}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                        {stage?.icon ? <stage.icon className="w-4 h-4 text-white" /> : <Loader2 className="w-4 h-4 text-white" />}
                    </div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                        {title}
                    </h3>
                </div>
                <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md">
                    {deals.length}
                </span>
            </div>

            <Droppable droppableId={stageId}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''
                            }`}
                    >
                        {status === 'pending' ? (
                            <div className="flex items-center justify-center p-8 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Cargando...
                            </div>
                        ) : status === 'error' ? (
                            <div className="p-4 text-destructive bg-destructive/10 rounded-lg text-sm text-center">
                                Error al cargar columna
                            </div>
                        ) : (
                            <>
                                {deals.map((deal: Deal, index: number) => (
                                    <KanbanCard
                                        key={deal.id}
                                        deal={deal}
                                        index={index}
                                        onEdit={() => onEditDeal(deal)}
                                        onContextMenu={(e) => onOpenContextMenu(e, deal.id)}
                                    />
                                ))}
                                {provided.placeholder}

                                {/* Scroll Anchor */}
                                <div ref={ref} className="h-4 flex items-center justify-center">
                                    {isFetchingNextPage && (
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Droppable>
        </div>
    )
}
