'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createClient } from '@/utils/supabase/client'
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
    MapPin,
    DollarSign
} from 'lucide-react'
import ClientModal from '@/components/ClientModal'
import NewDealModal from '@/components/kanban/NewDealModal'
import StageChangeModal from '@/components/kanban/StageChangeModal'
import ContextMenu from '@/components/ContextMenu'
import { Eye, Pencil, ArrowRightCircle } from 'lucide-react'

type Deal = {
    id: string
    title: string
    value: number
    currency: string
    status: string
    type: 'FCL' | 'LCL' | 'AEREO'
    client: {
        id: string
        company_name: string
        contact_name: string
    }
    updated_at: string
}

type BoardData = {
    [key: string]: Deal[]
}

const COLUMNS = [
    { id: 'CONTACTADO', title: 'Contactado', color: 'from-gray-400 to-gray-600', textColor: 'text-white', icon: ClipboardList },
    { id: 'CITA', title: 'Cita / Reunión', color: 'from-blue-400 to-blue-600', textColor: 'text-white', icon: PhoneCall },
    { id: 'PROCESO_COTIZACION', title: 'Cotizando', color: 'from-amber-400 to-orange-600', textColor: 'text-white', icon: Briefcase },
    { id: 'COTIZACION_ENVIADA', title: 'Cot. Enviada', color: 'from-purple-400 to-purple-600', textColor: 'text-white', icon: FileText },
    { id: 'CERRADO_GANADO', title: 'Ganado', color: 'from-emerald-400 to-green-600', textColor: 'text-white', icon: CheckCircle2 },
    { id: 'CERRADO_PERDIDO', title: 'Perdido', color: 'from-red-400 to-red-600', textColor: 'text-white', icon: XCircle },
]

const TYPE_ICONS = {
    FCL: Container,
    LCL: Briefcase,
    AEREO: Plane
}

export default function KanbanPage() {
    const [board, setBoard] = useState<BoardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null) // We can still open client modal by clicking deal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // State for Stage Change Modal
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

    // Context Menu State
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

    // Filter State
    const [filterType, setFilterType] = useState('ALL')

    const supabase = createClient()

    useEffect(() => {
        fetchBoard()
    }, [])

    const fetchBoard = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/kanban`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            })
            if (res.ok) {
                const data = await res.json()
                // Backend might group 'CERRADO' into one array. We need to split them if backend does so.
                // However, our backend implementation is: 
                // CERRADO: deals.filter(d => d.status === 'CERRADO_GANADO' || d.status === 'CERRADO_PERDIDO')
                // This puts both in 'CERRADO' key.
                // But we want separate columns.
                // We should manually redistribute 'CERRADO' into 'CERRADO_GANADO' and 'CERRADO_PERDIDO' if needed.
                // Or better: Update backend to return them separately? 
                // Or handle it here on frontend.

                const splitBoard = { ...data }

                // If backend returns 'CERRADO' array, split it
                if (splitBoard.CERRADO) {
                    splitBoard.CERRADO_GANADO = splitBoard.CERRADO.filter((d: Deal) => d.status === 'CERRADO_GANADO')
                    splitBoard.CERRADO_PERDIDO = splitBoard.CERRADO.filter((d: Deal) => d.status === 'CERRADO_PERDIDO')
                    delete splitBoard.CERRADO
                }

                // Ensure all expected columns exist
                COLUMNS.forEach(col => {
                    if (!splitBoard[col.id]) splitBoard[col.id] = []
                })

                setBoard(splitBoard)
            }
        } catch (error) {
            console.error("Error cargando kanban:", error)
        } finally {
            setLoading(false)
        }
    }

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
            fromStage: COLUMNS.find(c => c.id === source.droppableId)?.title || source.droppableId,
            toStage: COLUMNS.find(c => c.id === destination.droppableId)?.title || destination.droppableId,
            pendingSource: source,
            pendingDest: destination
        })
    }

    const handleConfirmMove = async (interactionData: { interactionType: string, summary: string, nextStep?: string }) => {
        if (!stageModal.dealId || !stageModal.pendingDest || !board) return

        const newStatus = stageModal.pendingDest.droppableId

        // 1. Optimistic Update
        const newBoard = { ...board }

        const sourceCol = newBoard[stageModal.pendingSource.droppableId]
        const destCol = newBoard[newStatus]

        const dealIndex = sourceCol.findIndex(d => d.id === stageModal.dealId)
        if (dealIndex === -1) return

        const [movedDeal] = sourceCol.splice(dealIndex, 1)
        movedDeal.status = newStatus

        if (stageModal.pendingDest.index !== undefined) {
            destCol.splice(stageModal.pendingDest.index, 0, movedDeal)
        } else {
            destCol.push(movedDeal)
        }

        setBoard(newBoard)
        setStageModal(prev => ({ ...prev, isOpen: false }))

        // 2. API Call
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const promises = []

            // Move Deal
            promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/deals/${stageModal.dealId}/move`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }))

            // Log Interaction (Linked to Client? Or Deal?)
            // Backend logs interaction to client currently.
            // Ideally we should link to deal too, but for now linking to client is key.
            // We need client_id from the deal object.
            const deal = movedDeal // Has client object

            promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/interactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    clientId: deal.client.id,
                    category: interactionData.interactionType,
                    summary: `[CAMBIO DE ETAPA: ${newStatus}] ${interactionData.summary}` + (interactionData.nextStep ? `\nPróximo paso: ${interactionData.nextStep}` : ''),
                    modality: 'N/A'
                })
            }))

            await Promise.all(promises)

        } catch (error) {
            console.error("Error executing move/log:", error)
            alert("Hubo un error al guardar los cambios.")
            fetchBoard()
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

    // Constants for Context Menu Logic
    const getContextDeal = () => {
        if (!contextMenu.dealId || !board) return null
        return Object.values(board).flat().find(d => d.id === contextMenu.dealId)
    }

    const handleMoveFromContext = (deal: Deal) => {
        // Find current stage
        let currentStageId = ''
        Object.keys(board || {}).forEach(key => {
            if (board?.[key].some(d => d.id === deal.id)) {
                currentStageId = key
            }
        })

        const currentIndex = COLUMNS.findIndex(c => c.id === currentStageId)
        if (currentIndex !== -1 && currentIndex < COLUMNS.length - 1) {
            const nextStage = COLUMNS[currentIndex + 1]
            setStageModal({
                isOpen: true,
                dealId: deal.id,
                dealTitle: deal.title,
                fromStage: COLUMNS[currentIndex].title,
                toStage: nextStage.title,
                pendingSource: { droppableId: currentStageId },
                pendingDest: { droppableId: nextStage.id, index: 0 }
            })
        } else {
            alert('Esta negociación ya está en la etapa final o no se puede mover automáticamente.')
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="mb-8 bg-gradient-to-r from-[#000D42] to-[#0066FF] rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Flujo de Ventas</h1>
                        <p className="text-blue-100 text-lg">Gestiona tus oportunidades comerciales</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-[#0066FF] px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <Plus size={20} />
                        Nueva Negociación
                    </button>

                </div>

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
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 h-full pb-4 overflow-x-auto">
                    {COLUMNS.map((col) => (
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
            {
                selectedClientId && (
                    <ClientModal
                        clientId={selectedClientId}
                        onClose={() => setSelectedClientId(null)}
                    />
                )
            }

            {
                isCreateModalOpen && (
                    <NewDealModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={() => {
                            fetchBoard()
                        }}
                    />
                )
            }

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