'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import PageHeader from '@/components/ui/PageHeader'
import {
    Loader2,
    Building2,
    CalendarClock,
    Plus,
    ClipboardList,
    PhoneCall,
    Briefcase,
    CheckCircle2,
    XCircle,
    FileText,
    Container,
    Plane,
    Eye,
    Pencil,
    ArrowRightCircle
} from 'lucide-react'
import ClientModal from '@/components/ClientModal'
import NewDealModal from '@/components/kanban/NewDealModal'
import StageChangeModal from '@/components/kanban/StageChangeModal'
import ContextMenu from '@/components/ContextMenu'
import { useDeals, KANBAN_COLUMNS } from '@/context/DealsContext'
import type { Deal } from '@/types'

const TYPE_ICONS = {
    FCL: Container,
    LCL: Briefcase,
    AEREO: Plane
}

export default function KanbanPage() {
    const { board, loading, refreshBoard, moveDeal } = useDeals()
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const [stageModal, setStageModal] = useState<{
        isOpen: boolean
        dealId: string | null
        dealTitle: string
        fromStage: string
        toStage: string
        pendingSource?: any
        pendingDest?: any
    }>({
        isOpen: false,
        dealId: null,
        dealTitle: '',
        fromStage: '',
        toStage: ''
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

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result

        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return
        }

        const deal = board?.[source.droppableId]?.find(d => d.id === draggableId)
        if (!deal) return

        setStageModal({
            isOpen: true,
            dealId: deal.id,
            dealTitle: deal.title,
            fromStage: KANBAN_COLUMNS.find(c => c.id === source.droppableId)?.title || source.droppableId,
            toStage: KANBAN_COLUMNS.find(c => c.id === destination.droppableId)?.title || destination.droppableId,
            pendingSource: source,
            pendingDest: destination
        })
    }

    const handleConfirmMove = async (interactionData: { interactionType: string, summary: string, nextStep?: string }) => {
        if (!stageModal.dealId || !stageModal.pendingDest || !board) return

        const newStatus = stageModal.pendingDest.droppableId

        try {
            await moveDeal(stageModal.dealId, newStatus, interactionData)
            setStageModal(prev => ({ ...prev, isOpen: false }))
        } catch (error) {
            console.error("Error confirming move:", error)
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
                dealTitle: deal.title,
                fromStage: KANBAN_COLUMNS[currentIndex].title,
                toStage: nextStage.title,
                pendingSource: { droppableId: currentStageId },
                pendingDest: { droppableId: nextStage.id, index: 0 }
            })
        } else {
            alert('Esta negociación ya está en la etapa final o no se puede mover automáticamente.')
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

    // Augment KANBAN_COLUMNS with UI info
    const COLUMNS_UI = KANBAN_COLUMNS.map(col => {
        let uiInfo = { color: 'from-gray-400 to-gray-600', textColor: 'text-white', icon: ClipboardList }
        switch (col.id) {
            case 'CONTACTADO': uiInfo = { color: 'from-gray-400 to-gray-600', textColor: 'text-white', icon: ClipboardList }; break;
            case 'CITA': uiInfo = { color: 'from-blue-400 to-blue-600', textColor: 'text-white', icon: PhoneCall }; break;
            case 'PROCESO_COTIZACION': uiInfo = { color: 'from-amber-400 to-orange-600', textColor: 'text-white', icon: Briefcase }; break;
            case 'COTIZACION_ENVIADA': uiInfo = { color: 'from-purple-400 to-purple-600', textColor: 'text-white', icon: FileText }; break;
            case 'CERRADO_GANADO': uiInfo = { color: 'from-emerald-400 to-green-600', textColor: 'text-white', icon: CheckCircle2 }; break;
            case 'CERRADO_PERDIDO': uiInfo = { color: 'from-red-400 to-red-600', textColor: 'text-white', icon: XCircle }; break;
        }
        return { ...col, ...uiInfo }
    })


    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="mb-8">
                <PageHeader
                    title="Flujo de Ventas"
                    subtitle="Gestiona tus oportunidades comerciales"
                    actionLabel="Nueva Negociación"
                    actionIcon={<Plus size={20} />}
                    onAction={() => setIsCreateModalOpen(true)}
                >
                    {/* Filters */}
                    <div className="mt-6 flex gap-2">
                        {[
                            { id: 'ALL', label: 'Todos' },
                            { id: 'FCL', label: 'FCL' },
                            { id: 'LCL', label: 'LCL' },
                            { id: 'AEREO', label: 'Aéreo' },
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setFilterType(type.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === type.id
                                    ? 'bg-white text-[#0066FF] shadow-md'
                                    : 'bg-[#000D42]/30 text-blue-100 hover:bg-[#000D42]/50'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </PageHeader>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 h-full pb-4 overflow-x-auto">
                    {COLUMNS_UI.map((col) => (
                        <div key={col.id} className="flex h-full flex-col rounded-2xl bg-white shadow-xl min-w-[300px] w-[300px]">
                            {/* Column Header */}
                            <div className={`bg-gradient-to-r ${col.color} rounded-t-2xl p-4 shadow-lg sticky top-0 z-10`}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <col.icon size={20} className={`shrink-0 ${col.textColor}`} />
                                        <h3 className={`font-bold text-sm truncate ${col.textColor}`}>{col.title}</h3>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-white/30 backdrop-blur-sm px-2 py-1 text-xs font-bold text-white shadow-md">
                                        {board && board[col.id]?.length}
                                    </span>
                                </div>
                            </div>

                            <Droppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 overflow-y-auto p-3 ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''} transition-colors scrollbar-thin scrollbar-thumb-gray-200`}
                                    >
                                        {board && board[col.id]?.filter(d => filterType === 'ALL' || d.type === filterType).map((deal, index) => {
                                            const TypeIcon = TYPE_ICONS[deal.type as keyof typeof TYPE_ICONS] || Briefcase
                                            return (
                                                <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`group mb-3 cursor-grab active:cursor-grabbing select-none rounded-xl bg-white p-4 shadow-md hover:shadow-xl transition-all border-l-4 ${col.id === 'CERRADO_GANADO' ? 'border-green-500' :
                                                                col.id === 'CERRADO_PERDIDO' ? 'border-red-500' :
                                                                    'border-[#0066FF]'
                                                                } ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-blue-300 scale-105 rotate-2' : 'hover:scale-[1.02]'}`}
                                                            onClick={() => setSelectedClientId(deal.client.id)}
                                                            onContextMenu={(e) => handleContextMenu(e, deal.id)}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight group-hover:text-[#0066FF] transition-colors">
                                                                    {deal.title}
                                                                </h4>
                                                                <span className="shrink-0 p-1 bg-gray-100 rounded-lg text-gray-500">
                                                                    <TypeIcon size={14} />
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Building2 size={12} className="text-gray-400" />
                                                                <span className="text-xs text-gray-500 font-medium truncate">{deal.client.company_name}</span>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                                <span className="text-sm font-bold text-gray-900">
                                                                    ${deal.value?.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">{deal.currency}</span>
                                                                </span>
                                                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                                    <CalendarClock size={12} />
                                                                    <span>{new Date(deal.updated_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            )
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {/* MODALS */}
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
                    }}
                />
            )}

            <StageChangeModal
                isOpen={stageModal.isOpen}
                onClose={() => setStageModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmMove}
                dealTitle={stageModal.dealTitle}
                fromStage={stageModal.fromStage}
                toStage={stageModal.toStage}
            />

            {contextMenu.isOpen && getContextDeal() && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    title={getContextDeal()?.title}
                    onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
                    items={[
                        {
                            label: 'Ver Detalles',
                            icon: Eye,
                            action: () => {
                                const deal = getContextDeal()
                                if (deal) setSelectedClientId(deal.client.id)
                            }
                        },
                        {
                            label: 'Editar Negociación',
                            icon: Pencil,
                            action: () => alert('Funcionalidad de Edición Rápida en desarrollo. Por favor edita desde "Ver Detalles".')
                        },
                        {
                            label: 'Mover Siguiente',
                            icon: ArrowRightCircle,
                            action: () => {
                                const deal = getContextDeal()
                                if (deal) handleMoveFromContext(deal)
                            }
                        },
                        {
                            label: 'Contactar Cliente',
                            icon: PhoneCall,
                            action: () => {
                                const deal = getContextDeal()
                                if (deal) setSelectedClientId(deal.client.id)
                            }
                        }
                    ]}
                />
            )}
        </div >
    )
}