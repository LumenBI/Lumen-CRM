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
    ArrowRightCircle,
    List,
    LayoutGrid
} from 'lucide-react'
import ClientModal from '@/components/ClientModal'
import NewDealModal from '@/components/kanban/NewDealModal'
import EditDealModal from '@/components/kanban/EditDealModal'
import StageChangeModal from '@/components/kanban/StageChangeModal'
import ContextMenu from '@/components/ContextMenu'
import { useDeals, KANBAN_COLUMNS } from '@/context/DealsContext'
import type { Deal } from '@/types'
import { toast } from 'sonner'
import { TEXTS } from '@/constants/text'
import DealsListView from '@/components/kanban/DealsListView'

const TYPE_ICONS = {
    FCL: Container,
    LCL: Briefcase,
    AEREO: Plane
}

export default function KanbanPage() {
    const { board, loading, refreshBoard, moveDeal } = useDeals()
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
    const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

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
            toast.success('Seguimiento actualizado')
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
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#000d42]">{TEXTS.SALES_FLOW_TITLE}</h1>
                    <p className="text-slate-500">Gestiona tus oportunidades comerciales</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center shadow-sm">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'kanban'
                                ? 'bg-blue-50 text-[#0056fc]'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            title="Vista de Tablero"
                        >
                            <LayoutGrid size={18} />
                            <span className="hidden sm:inline">Tablero</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'list'
                                ? 'bg-blue-50 text-[#0056fc]'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            title="Vista de Lista"
                        >
                            <List size={18} />
                            <span className="hidden sm:inline">Lista</span>
                        </button>
                    </div>

                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setFilterType('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'ALL' ? 'bg-[#000d42] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Ver todos
                        </button>
                        <button
                            onClick={() => setFilterType('FCL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'FCL' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            FCL
                        </button>
                        <button
                            onClick={() => setFilterType('LCL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'LCL' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            LCL
                        </button>
                        <button
                            onClick={() => setFilterType('AEREO')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'AEREO' ? 'bg-purple-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Aéreo
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors font-medium shadow-sm"
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
                                        <div className={`p-4 rounded-t-xl mb-0 border-b-4 ${column.id === 'PENDING' ? 'bg-gray-500 border-gray-600 text-white' :
                                            column.id === 'CONTACTADO' ? 'bg-slate-600 border-slate-700 text-white' :
                                                column.id === 'CITA' ? 'bg-blue-600 border-blue-700 text-white' :
                                                    column.id === 'PROCESO_COTIZACION' ? 'bg-orange-500 border-orange-600 text-white' :
                                                        column.id === 'COTIZACION_ENVIADA' ? 'bg-purple-600 border-purple-700 text-white' :
                                                            column.id === 'CERRADO_GANADO' ? 'bg-green-600 border-green-700 text-white' :
                                                                'bg-red-500 border-red-600 text-white'
                                            } shadow-sm`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                                                    {column.id === 'PENDING' && <ClipboardList size={14} />}
                                                    {column.id === 'CONTACTADO' && <ClipboardList size={14} />}
                                                    {column.id === 'CITA' && <PhoneCall size={14} />}
                                                    {column.id === 'PROCESO_COTIZACION' && <Briefcase size={14} />}
                                                    {column.id === 'COTIZACION_ENVIADA' && <FileText size={14} />}
                                                    {column.id === 'CERRADO_GANADO' && <CheckCircle2 size={14} />}
                                                    {column.id === 'CERRADO_PERDIDO' && <XCircle size={14} />}
                                                    {column.title}
                                                </div>
                                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {columnDeals.length}
                                                </span>
                                            </div>
                                        </div>

                                        <Droppable droppableId={column.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className={`flex-1 p-2 bg-gray-50/50 rounded-b-xl border border-gray-100 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-100 ring-inset' : ''
                                                        }`}
                                                >
                                                    <div className="space-y-3">
                                                        {columnDeals.map((deal, index) => {
                                                            const Icon = TYPE_ICONS[deal.type as keyof typeof TYPE_ICONS] || Briefcase

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
                                                                            className={`bg-white p-4 rounded-xl border shadow-sm group hover:shadow-md transition-all relative ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-blue-500 z-50' : 'border-gray-100 hover:border-blue-200'
                                                                                }`}
                                                                            style={provided.draggableProps.style}
                                                                        >
                                                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button className="p-1 hover:bg-gray-100 rounded">
                                                                                    <Pencil size={14} className="text-gray-400" />
                                                                                </button>
                                                                            </div>

                                                                            <div className="mb-3">
                                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${deal.type === 'FCL' ? 'bg-blue-50 text-blue-700' :
                                                                                    deal.type === 'LCL' ? 'bg-orange-50 text-orange-700' :
                                                                                        'bg-purple-50 text-purple-700'
                                                                                    }`}>
                                                                                    <Icon size={10} />
                                                                                    {deal.type}
                                                                                </span>
                                                                            </div>

                                                                            <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 leading-relaxed">
                                                                                {deal.title}
                                                                            </h4>

                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                                                    {deal.client?.company_name.substring(0, 1)}
                                                                                </div>
                                                                                <span className="text-xs text-gray-500 font-medium truncate max-w-[180px]">
                                                                                    {deal.client?.company_name}
                                                                                </span>
                                                                            </div>

                                                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                                                <span className="text-sm font-bold text-gray-900">
                                                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency, maximumFractionDigits: 0 }).format(deal.value)}
                                                                                </span>
                                                                                {deal.expected_close_date && (
                                                                                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
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
                <DealsListView deals={filteredDeals} onEdit={() => { }} onMove={() => { }} />
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
                    onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
                    items={[
                        {
                            label: 'Ver detalles',
                            icon: Eye,
                            action: () => {
                                const deal = getContextDeal()
                                if (deal) setSelectedClientId(deal.client.id)
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
                            action: () => {
                                const deal = getContextDeal()
                                if (deal) setSelectedClientId(deal.client.id)
                            }
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
        </div >
    )
}