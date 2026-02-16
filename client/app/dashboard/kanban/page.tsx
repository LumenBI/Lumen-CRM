'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import PageHeader from '@/components/ui/PageHeader'
import {
    Loader2,
    Building2,
    CalendarClock,
    Plus,
    Eye,
    Pencil,
    ArrowRightCircle,
    List,
    LayoutGrid,
    PhoneCall,
    Phone,
    Mail,
    Trash2
} from 'lucide-react'
import ClientModal from '@/components/ClientModal'
import NewDealModal from '@/components/kanban/NewDealModal'
import EditDealModal from '@/components/kanban/EditDealModal'
import StageChangeModal, { STAGE_ID_COTIZANDO } from '@/components/kanban/StageChangeModal'
import ContextMenu from '@/components/ContextMenu'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { useDeals, KANBAN_COLUMNS } from '@/context/DealsContext'
import { useQuickActions } from '@/context/QuickActionsContext'
import { useApi } from '@/hooks/useApi'
import { useQueryClient } from '@tanstack/react-query'
import type { Deal } from '@/types'
import { toast } from 'sonner'
import { TEXTS } from '@/constants/text'
import DealsListView from '@/components/kanban/DealsListView'
import { STAGE_MAP } from '@/constants/stages'
import { SHIPPING_TYPES, SHIPPING_TYPE_MAP } from '@/constants/shipping'
import ConfirmModal from '@/components/ui/ConfirmModal'
import SmartKanbanColumn from '@/components/kanban/SmartKanbanColumn'

export default function KanbanPage() {
    const router = useRouter()
    const { refreshBoard, moveDeal } = useDeals()
    const queryClient = useQueryClient()
    const { deals: dealsApi } = useApi()
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
    const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
    const { requestAction, clearAction } = useQuickActions()

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setViewMode('list')
        }
    }, [])

    useEffect(() => {
        if (requestAction === 'newDeal') {
            setIsCreateModalOpen(true)
            clearAction()
        }
    }, [requestAction, clearAction])

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean
        dealId: string | null
        isDeleting: boolean
    }>({
        isOpen: false,
        dealId: null,
        isDeleting: false
    })

    const [stageModal, setStageModal] = useState<{
        isOpen: boolean
        dealId: string | null
        deal: Deal | null
        dealTitle: string
        fromStage: string
        toStage: string
        toStageId: string
        pendingSource?: any
        pendingDest?: any
    }>({
        isOpen: false,
        dealId: null,
        deal: null,
        dealTitle: '',
        fromStage: '',
        toStage: '',
        toStageId: ''
    })

    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean
        x: number
        y: number
        dealId: string | null
    }>({
        isOpen: false,
        x: 0,
        y: 0,
        dealId: null
    })

    const [filterType, setFilterType] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result

        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return
        }

        // Get the deal object from the source column cache
        const sourceData = queryClient.getQueryData<any>(['deals', 'column', source.droppableId])
        if (!sourceData) return

        let movedDeal: Deal | undefined
        sourceData.pages.some((page: any) => {
            const found = page.items.find((d: Deal) => d.id === draggableId)
            if (found) {
                movedDeal = found
                return true
            }
            return false
        })

        if (!movedDeal) return

        setStageModal({
            isOpen: true,
            dealId: movedDeal.id,
            deal: movedDeal,
            dealTitle: movedDeal.title,
            fromStage: KANBAN_COLUMNS.find(c => c.id === source.droppableId)?.title || source.droppableId,
            toStage: KANBAN_COLUMNS.find(c => c.id === destination.droppableId)?.title || destination.droppableId,
            toStageId: destination.droppableId,
            pendingSource: source,
            pendingDest: destination
        })
    }

    const handleCancelMove = () => {
        setStageModal(prev => ({ ...prev, isOpen: false }))
    }

    const handleConfirmMove = async (
        interactionData: { interactionType: string, summary: string, nextStep?: string },
        options?: { prepareQuote?: boolean }
    ) => {
        if (!stageModal.dealId || !stageModal.pendingDest) return

        const newStatus = stageModal.pendingDest.droppableId
        const deal = stageModal.deal
        const shouldOpenQuotes = options?.prepareQuote === true && newStatus === STAGE_ID_COTIZANDO && deal

        try {
            await moveDeal(stageModal.dealId, newStatus, {
                ...interactionData,
                clientId: deal?.client?.id || (deal as any)?.client_id || ''
            })
            setStageModal(prev => ({ ...prev, isOpen: false }))
            toast.success('Seguimiento actualizado')
            if (shouldOpenQuotes) {
                const params = new URLSearchParams({
                    dealId: deal.id,
                    clientName: (deal.client as { company_name?: string })?.company_name || deal.title || ''
                })
                const email = (deal.client as { email?: string })?.email
                if (email) params.set('clientEmail', email)
                router.push(`/dashboard/quotes?${params.toString()}`)
            }
        } catch (error) {
            console.error(error)
            toast.error('Error al mover el seguimiento')
        }
    }

    const handleContextMenu = (e: React.MouseEvent, dealId: string) => {
        e.preventDefault()
        setContextMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            dealId
        })
    }

    const getContextDeal = () => {
        if (!contextMenu.dealId) return null
        for (const col of KANBAN_COLUMNS) {
            const data = queryClient.getQueryData<any>(['deals', 'column', col.id])
            if (data) {
                for (const page of data.pages) {
                    const deal = page.items.find((d: Deal) => d.id === contextMenu.dealId)
                    if (deal) return deal
                }
            }
        }
        return null
    }

    const handleMoveFromContext = (deal: Deal) => {
        let currentStageId = ''
        for (const col of KANBAN_COLUMNS) {
            const data = queryClient.getQueryData<any>(['deals', 'column', col.id])
            if (data?.pages.some((p: any) => p.items.some((d: Deal) => d.id === deal.id))) {
                currentStageId = col.id
                break
            }
        }

        const currentIndex = KANBAN_COLUMNS.findIndex(c => c.id === currentStageId)
        if (currentIndex !== -1 && currentIndex < KANBAN_COLUMNS.length - 1) {
            const nextStage = KANBAN_COLUMNS[currentIndex + 1]
            setStageModal({
                isOpen: true,
                dealId: deal.id,
                deal,
                dealTitle: deal.title,
                fromStage: KANBAN_COLUMNS[currentIndex].title,
                toStage: nextStage.title,
                toStageId: nextStage.id,
                pendingSource: { droppableId: currentStageId },
                pendingDest: { droppableId: nextStage.id, index: 0 }
            })
        } else {
            toast.info('Esta negociación ya está en la etapa final o no se puede mover automáticamente.')
        }
    }

    const handleDeleteDeal = async () => {
        if (!deleteModal.dealId) return
        setDeleteModal(prev => ({ ...prev, isDeleting: true }))
        try {
            await dealsApi.delete(deleteModal.dealId)
            toast.success('Seguimiento eliminado')
            refreshBoard()
            setDeleteModal({ isOpen: false, dealId: null, isDeleting: false })
        } catch (error) {
            console.error(error)
            toast.error('Error al eliminar')
            setDeleteModal(prev => ({ ...prev, isDeleting: false }))
        }
    }

    return (
        <div className="space-y-6 h-full flex flex-col p-4 md:p-6 bg-transparent dark:text-white transition-colors">
            <PageHeader
                title={TEXTS.SALES_FLOW_TITLE}
                subtitle="Gestiona tus oportunidades comerciales"
                icon={LayoutGrid}
                actionLabel="Nuevo seguimiento"
                actionIcon={<Plus size={18} />}
                onAction={() => setIsCreateModalOpen(true)}
                extraActions={
                    <div className="flex flex-wrap items-center gap-3">
                        <SegmentedControl
                            value={viewMode}
                            onChange={(val: string) => setViewMode(val as 'kanban' | 'list')}
                            options={[
                                { label: 'Tablero', value: 'kanban', icon: LayoutGrid },
                                { label: 'Lista', value: 'list', icon: List }
                            ]}
                        />

                        <SegmentedControl
                            value={filterType}
                            onChange={(val: string) => setFilterType(val)}
                            options={[
                                { label: 'Ver todos', value: 'ALL' },
                                ...SHIPPING_TYPES.map(st => ({ label: st.label, value: st.id }))
                            ]}
                        />
                    </div>
                }
            />

            {viewMode === 'kanban' ? (
                <div className="flex-1 overflow-x-auto pb-4">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex gap-6 min-w-max h-full">
                            {KANBAN_COLUMNS.map((column: any) => (
                                <SmartKanbanColumn
                                    key={column.id}
                                    id={column.id}
                                    title={column.title}
                                    onEditDeal={setEditingDeal}
                                    onOpenContextMenu={handleContextMenu}
                                />
                            ))}
                        </div>
                    </DragDropContext>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <DealsListView
                        deals={[]}
                        onEdit={setEditingDeal}
                        onMove={handleMoveFromContext}
                        onDelete={(deal) => setDeleteModal({ isOpen: true, dealId: deal.id, isDeleting: false })}
                    />
                </div>
            )}

            {selectedClientId && (
                <ClientModal
                    clientId={selectedClientId}
                    onClose={() => setSelectedClientId(null)}
                />
            )}

            {isCreateModalOpen && (
                <NewDealModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        refreshBoard()
                        setIsCreateModalOpen(false)
                        toast.success('Seguimiento creado exitosamente')
                    }}
                />
            )}

            <StageChangeModal
                isOpen={stageModal.isOpen}
                onClose={handleCancelMove}
                onConfirm={handleConfirmMove}
                dealTitle={stageModal.dealTitle}
                fromStage={stageModal.fromStage}
                toStage={stageModal.toStage}
                toStageId={stageModal.toStageId}
                loading={false}
            />

            {contextMenu.isOpen && getContextDeal() && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
                    items={[
                        {
                            label: 'Ver detalles',
                            icon: Eye,
                            action: () => {
                                const deal = getContextDeal()
                                if (deal?.client?.id) setSelectedClientId(deal.client.id)
                            }
                        },
                        {
                            label: 'Editar',
                            icon: Pencil,
                            action: () => {
                                const deal = getContextDeal()
                                if (deal) setEditingDeal(deal)
                            }
                        },
                        {
                            label: 'Mover',
                            icon: ArrowRightCircle,
                            action: () => {
                                const deal = getContextDeal()
                                if (deal) handleMoveFromContext(deal)
                            }
                        },
                        {
                            label: 'Contactar cliente',
                            icon: PhoneCall,
                            subItems: [
                                {
                                    label: `Llamar (${getContextDeal()?.client?.phone || 'N/A'})`,
                                    icon: Phone,
                                    action: () => {
                                        const phone = getContextDeal()?.client?.phone
                                        if (phone) window.location.href = `tel:${phone}`
                                        else toast.error('No hay teléfono registrado')
                                    }
                                },
                                {
                                    label: 'Enviar Email',
                                    icon: Mail,
                                    action: () => {
                                        const email = getContextDeal()?.client?.email
                                        if (email) window.location.href = `mailto:${email}`
                                        else toast.error('No hay email registrado')
                                    }
                                },
                                {
                                    label: 'Ver perfil completo',
                                    icon: Eye,
                                    action: () => {
                                        const deal = getContextDeal()
                                        if (deal?.client?.id) setSelectedClientId(deal.client.id)
                                    }
                                }
                            ]
                        }
                    ]}
                />
            )}

            {editingDeal && (
                <EditDealModal
                    deal={editingDeal}
                    onClose={() => setEditingDeal(null)}
                    onSuccess={() => {
                        refreshBoard()
                        setEditingDeal(null)
                    }}
                />
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, dealId: null, isDeleting: false })}
                onConfirm={handleDeleteDeal}
                isLoading={deleteModal.isDeleting}
                title="Eliminar Seguimiento"
                message="¿Estás seguro de que deseas eliminar este seguimiento? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                isDestructive={true}
            />
        </div >
    )
}
