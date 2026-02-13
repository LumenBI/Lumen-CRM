'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
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
import { useDeals, KANBAN_COLUMNS, type KanbanBoard } from '@/context/DealsContext'
import { useQuickActions } from '@/context/QuickActionsContext'
import { useApi } from '@/hooks/useApi'
import type { Deal } from '@/types'
import { toast } from 'sonner'
import { TEXTS } from '@/constants/text'
import DealsListView from '@/components/kanban/DealsListView'
import { STAGE_MAP } from '@/constants/stages'
import { SHIPPING_TYPES, SHIPPING_TYPE_MAP } from '@/constants/shipping'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function KanbanPage() {
    const router = useRouter()
    const { board, loading, refreshBoard, moveDeal, updateBoard } = useDeals()
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

    const [previousBoard, setPreviousBoard] = useState<KanbanBoard | null>(null)

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result

        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return
        }

        if (!board) return
        setPreviousBoard({ ...board })

        // Optimistic Move for Instant UI feedback
        const newBoard = { ...board }
        const sourceCol = [...newBoard[source.droppableId]]
        const destCol = source.droppableId === destination.droppableId ? sourceCol : [...newBoard[destination.droppableId]]

        const [movedDeal] = sourceCol.splice(source.index, 1)
        destCol.splice(destination.index, 0, movedDeal)

        newBoard[source.droppableId] = sourceCol
        newBoard[destination.droppableId] = destCol

        updateBoard(newBoard) // Update the context board immediately

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
        if (previousBoard) {
            updateBoard(previousBoard)
            setPreviousBoard(null)
        }
        setStageModal(prev => ({ ...prev, isOpen: false }))
    }

    const handleConfirmMove = async (
        interactionData: { interactionType: string, summary: string, nextStep?: string },
        options?: { prepareQuote?: boolean }
    ) => {
        if (!stageModal.dealId || !stageModal.pendingDest || !board) return

        const newStatus = stageModal.pendingDest.droppableId
        const deal = stageModal.deal
        const shouldOpenQuotes = options?.prepareQuote === true && newStatus === STAGE_ID_COTIZANDO && deal

        try {
            await moveDeal(stageModal.dealId, newStatus, interactionData)
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
        if (!contextMenu.dealId || !board) return null
        return Object.values(board).flat().find(d => d.id === contextMenu.dealId)
    }

    const handleMoveFromContext = (deal: Deal) => {
        let currentStageId = ''
        Object.keys(board || {}).forEach(key => {
            if (board?.[key].some(d => d.id === deal.id)) {
                currentStageId = key
            }
        })

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

    const allDeals = board ? Object.values(board).flat() : []
    const filteredDeals = allDeals.filter(deal => {
        if (filterType === 'ALL') return true
        return deal.type === filterType
    })


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-gray-500 font-medium">Cargando tablero...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 h-full flex flex-col p-4 md:p-6 bg-transparent dark:text-white transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#000d42] dark:text-white">{TEXTS.SALES_FLOW_TITLE}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestiona tus oportunidades comerciales</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex items-center shadow-sm">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'kanban'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0056fc] dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            title="Vista de Tablero"
                        >
                            <LayoutGrid size={18} />
                            <span className="hidden sm:inline">Tablero</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'list'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0056fc] dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            title="Vista de Lista"
                        >
                            <List size={18} />
                            <span className="hidden sm:inline">Lista</span>
                        </button>
                    </div>

                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                        <button
                            onClick={() => setFilterType('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'ALL' ? 'bg-[#000d42] dark:bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                            Ver todos
                        </button>
                        {SHIPPING_TYPES.map(st => (
                            <button
                                key={st.id}
                                onClick={() => setFilterType(st.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === st.id ? `${st.filterColor} text-white shadow-md` : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        {TEXTS.NEW_DEAL}
                    </button>
                </div>
            </div>

            {viewMode === 'kanban' ? (
                <div className="flex-1 overflow-x-auto pb-4">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex gap-6 min-w-max h-full">
                            {KANBAN_COLUMNS.map(column => {
                                const columnDeals = board?.[column.id]?.filter(d => filterType === 'ALL' || d.type === filterType) || []
                                const totalValue = columnDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0)

                                return (
                                    <div key={column.id} className="w-80 flex-shrink-0 flex flex-col h-full max-h-[calc(100vh-12rem)]">
                                        {(() => {
                                            const stageConfig = STAGE_MAP[column.id]
                                            const StageIcon = stageConfig?.icon
                                            return (
                                                <div className={`p-4 rounded-t-xl mb-0 border-b-4 ${stageConfig ? `${stageConfig.headerBg} ${stageConfig.headerBorder} text-white` : 'bg-gray-500 border-gray-600 text-white'} shadow-sm`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                                                            {StageIcon && <StageIcon size={14} />}
                                                            {column.title}
                                                        </div>
                                                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                                            {columnDeals.length}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        <Droppable droppableId={column.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className={`flex-1 p-2 bg-gray-50/50 dark:bg-slate-900/20 rounded-b-xl border border-gray-100 dark:border-slate-800 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-100 dark:ring-blue-900 ring-inset' : ''
                                                        }`}
                                                >
                                                    <div className="space-y-3">
                                                        {columnDeals.map((deal, index) => {
                                                            return (
                                                                <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            onClick={() => {
                                                                            }}
                                                                            onContextMenu={(e) => handleContextMenu(e, deal.id)}
                                                                            className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm group hover:shadow-md transition-all relative ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-blue-500 z-50' : 'border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                                                                                }`}
                                                                            style={provided.draggableProps.style}
                                                                        >
                                                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setEditingDeal(deal)
                                                                                    }}
                                                                                    className="p-1 hover:bg-gray-100 rounded"
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
                                                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency, maximumFractionDigits: 0 }).format(deal.value)}
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
                                                        })}
                                                        {provided.placeholder}
                                                    </div>
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                )
                            })}
                        </div>
                    </DragDropContext>
                </div>
            ) : (
                <DealsListView
                    deals={filteredDeals}
                    onEdit={(deal) => setEditingDeal(deal)}
                    onMove={(deal) => handleMoveFromContext(deal)}
                    onDelete={async (deal) => {
                        setDeleteModal({
                            isOpen: true,
                            dealId: deal.id,
                            isDeleting: false
                        })
                    }}
                />
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
                loading={stageModal.isOpen && !board} // Simple loading check
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