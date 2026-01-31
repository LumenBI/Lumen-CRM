'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createClient } from '@/utils/supabase/client'
import {
    LucideLoader2,
    LucideBuilding2,
    LucideCalendarClock,
    LucidePlus,
    LucideClipboardList,
    LucidePhoneCall,
    LucideBriefcase,
    LucideCheckCircle,
    LucideXCircle
} from 'lucide-react'
import ClientModal from '@/components/ClientModal'
import NewTrackingModal from '@/components/kanban/NewTrackingModal'
import StageChangeModal from '@/components/kanban/StageChangeModal'

// ... (Tipos Client y BoardData igual que antes)
type Client = {
    id: string
    company_name: string
    contact_name: string
    email: string
    status: string
    assignment_expires_at?: string
}

type BoardData = {
    [key: string]: Client[]
}

const COLUMNS = [
    { id: 'PENDING', title: 'Prospectos', color: 'from-gray-400 to-gray-600', textColor: 'text-white', icon: LucideClipboardList },
    { id: 'CONTACTED', title: 'Contactados', color: 'from-blue-400 to-blue-600', textColor: 'text-white', icon: LucidePhoneCall },
    { id: 'IN_NEGOTIATION', title: 'En Negociación', color: 'from-amber-400 to-orange-600', textColor: 'text-white', icon: LucideBriefcase },
    { id: 'CLOSED_WON', title: 'Cerrado Ganado', color: 'from-emerald-400 to-green-600', textColor: 'text-white', icon: LucideCheckCircle },
    { id: 'CLOSED_LOST', title: 'Perdido', color: 'from-red-400 to-red-600', textColor: 'text-white', icon: LucideXCircle },
]

export default function KanbanPage() {
    const [board, setBoard] = useState<BoardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // State for Stage Change Modal
    const [stageModal, setStageModal] = useState<{
        isOpen: boolean
        clientId: string | null
        clientName: string
        fromStage: string
        toStage: string
        // We store the pending move to execute it after confirmation
        pendingSource?: any
        pendingDest?: any
    }>({
        isOpen: false,
        clientId: null,
        clientName: '',
        fromStage: '',
        toStage: ''
    })

    const supabase = createClient()

    useEffect(() => {
        fetchBoard()
    }, [])

    const fetchBoard = async () => {
        // ... (Keep existing fetch logic)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/kanban`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setBoard(data)
            }
        } catch (error) {
            console.error("Error cargando kanban:", error)
        } finally {
            setLoading(false)
        }
    }

    // Helper to get next logical stage
    const getNextStage = (currentStageId: string) => {
        const index = COLUMNS.findIndex(c => c.id === currentStageId)
        if (index === -1 || index === COLUMNS.length - 1) return null
        return COLUMNS[index + 1]
    }

    const handleQuickMove = (e: React.MouseEvent, client: Client, currentColId: string) => {
        e.stopPropagation()
        const nextStage = getNextStage(currentColId)
        if (!nextStage) return

        setStageModal({
            isOpen: true,
            clientId: client.id,
            clientName: client.company_name,
            fromStage: COLUMNS.find(c => c.id === currentColId)?.title || currentColId,
            toStage: nextStage.title,
            pendingDest: { droppableId: nextStage.id } // Minimal info needed
        })
    }

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result

        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return
        }

        // Just open the modal, don't move yet
        const client = board?.[source.droppableId]?.find(c => c.id === draggableId)
        if (!client) return

        setStageModal({
            isOpen: true,
            clientId: client.id,
            clientName: client.company_name,
            fromStage: COLUMNS.find(c => c.id === source.droppableId)?.title || source.droppableId,
            toStage: COLUMNS.find(c => c.id === destination.droppableId)?.title || destination.droppableId,
            pendingSource: source,
            pendingDest: destination
        })
    }

    const handleConfirmMove = async (interactionData: { interactionType: string, summary: string, nextStep?: string }) => {
        if (!stageModal.clientId || !stageModal.pendingDest || !board) return

        const newStatus = stageModal.pendingDest.droppableId

        // 1. Optimistic Update
        const newBoard = { ...board }

        // Find source (might not be in pendingSource if it was a button click)
        const sourceColId = Object.keys(newBoard).find(key => newBoard[key].some(c => c.id === stageModal.clientId))
        if (!sourceColId) return

        const sourceCol = newBoard[sourceColId]
        const destCol = newBoard[newStatus]

        const clientIndex = sourceCol.findIndex(c => c.id === stageModal.clientId)
        if (clientIndex === -1) return

        const [movedClient] = sourceCol.splice(clientIndex, 1)
        movedClient.status = newStatus

        // Should we respect the index from drag? 
        if (stageModal.pendingDest.index !== undefined) {
            destCol.splice(stageModal.pendingDest.index, 0, movedClient)
        } else {
            destCol.push(movedClient) // Is pendingDest doesn't have index (button click), append
        }

        setBoard(newBoard)
        setStageModal(prev => ({ ...prev, isOpen: false })) // Close modal immediately

        // 2. API Call
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return // Revert?

        try {
            const promises = []

            // Move Client
            promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/kanban/move`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    clientId: stageModal.clientId,
                    newStatus: newStatus
                })
            }))

            // Log Interaction
            promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/interactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    clientId: stageModal.clientId,
                    category: interactionData.interactionType,
                    summary: interactionData.summary + (interactionData.nextStep ? `\nPróximo paso: ${interactionData.nextStep}` : ''),
                    modality: 'N/A' // Default
                })
            }))

            await Promise.all(promises)

        } catch (error) {
            console.error("Error executing move/log:", error)
            alert("Hubo un error al guardar los cambios. Por favor recarga.")
            fetchBoard() // Rollback by refetch
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><LucideLoader2 className="animate-spin" /></div>

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            {/* Header ... (Keep existing) */}
            <div className="mb-8 bg-gradient-to-r from-[#000D42] to-[#0066FF] rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Flujo de Oportunidades</h1>
                        <p className="text-blue-100 text-lg">Gestiona tus clientes en tiempo real</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-[#0066FF] px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <LucidePlus size={20} />
                        Nuevo Seguimiento
                    </button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex h-full gap-6 overflow-x-auto pb-4">
                    {COLUMNS.map((col) => (
                        <div key={col.id} className="flex h-full w-80 min-w-[320px] flex-col rounded-2xl bg-white shadow-xl">
                            {/* Column Header */}
                            <div className={`bg-gradient-to-r ${col.color} rounded-t-2xl p-6 shadow-lg`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <col.icon size={28} className={col.textColor} />
                                        <h3 className={`font-bold text-lg ${col.textColor}`}>{col.title}</h3>
                                    </div>
                                    <span className="rounded-full bg-white/30 backdrop-blur-sm px-3 py-1.5 text-sm font-bold text-white shadow-md">
                                        {board && board[col.id]?.length}
                                    </span>
                                </div>
                            </div>

                            <Droppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 overflow-y-auto p-4 ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''} transition-colors`}
                                    >
                                        {board && board[col.id]?.map((client, index) => (
                                            <Draggable key={client.id} draggableId={client.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => setSelectedClientId(client.id)}
                                                        className={`group mb-4 cursor-grab active:cursor-grabbing select-none rounded-xl bg-white p-5 shadow-md hover:shadow-xl transition-all border-l-4 border-[#0066FF] ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-blue-300 scale-105 rotate-2' : 'hover:scale-[1.02]'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#0052CC] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                                    <LucideBuilding2 size={24} className="text-white" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-base font-bold text-[#000D42] group-hover:text-[#0066FF] transition-colors line-clamp-1">
                                                                        {client.company_name}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-600 line-clamp-1">
                                                                        {client.contact_name || 'Sin Contacto'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Info Tag */}
                                                        <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-500 mb-3">
                                                            <LucideCalendarClock size={14} className="text-[#0066FF]" />
                                                            <span>Caduca: {client.assignment_expires_at ? new Date(client.assignment_expires_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'N/A'}</span>
                                                        </div>

                                                        {/* Quick Action Button - NEW */}
                                                        {getNextStage(col.id) && (
                                                            <button
                                                                onClick={(e) => handleQuickMove(e, client, col.id)}
                                                                className="w-full mt-2 py-2 px-3 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 group/btn"
                                                            >
                                                                Mover a {getNextStage(col.id)?.title}
                                                                <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity">→</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
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
                <NewTrackingModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        fetchBoard()
                    }}
                />
            )}

            <StageChangeModal
                isOpen={stageModal.isOpen}
                onClose={() => setStageModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmMove}
                clientName={stageModal.clientName}
                fromStage={stageModal.fromStage}
                toStage={stageModal.toStage}
            />
        </div>
    )
}