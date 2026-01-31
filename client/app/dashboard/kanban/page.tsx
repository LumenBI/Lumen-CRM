'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createClient } from '@/utils/supabase/client'
import { LucideLoader2, LucideBuilding2, LucideCalendarClock } from 'lucide-react'
import ClientModal from '@/components/ClientModal'

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
    { id: 'PENDING', title: 'Prospectos', color: 'bg-gray-100 border-gray-200' },
    { id: 'CONTACTED', title: 'Contactados', color: 'bg-blue-50 border-blue-200' },
    { id: 'IN_NEGOTIATION', title: 'En Negociación', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'CLOSED_WON', title: 'Cerrado Ganado', color: 'bg-green-50 border-green-200' },
    { id: 'CLOSED_LOST', title: 'Perdido', color: 'bg-red-50 border-red-200' },
]

export default function KanbanPage() {
    const [board, setBoard] = useState<BoardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
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
                setBoard(data)
            }
        } catch (error) {
            console.error("Error cargando kanban:", error)
        } finally {
            setLoading(false)
        }
    }

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result

        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return
        }
        const newBoard = { ...board } as BoardData
        const sourceCol = newBoard[source.droppableId]
        const destCol = newBoard[destination.droppableId]
        const [movedClient] = sourceCol.splice(source.index, 1)

        movedClient.status = destination.droppableId
        destCol.splice(destination.index, 0, movedClient)

        setBoard(newBoard)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/kanban/move`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    clientId: draggableId,
                    newStatus: destination.droppableId
                })
            })
        } catch (error) {
            console.error("Error guardando movimiento:", error)
            alert("Error al guardar cambios. Recarga la página.")
            fetchBoard()
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><LucideLoader2 className="animate-spin" /></div>

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Flujo de Oportunidades</h1>
                <div className="text-sm text-gray-500">Arrastra las tarjetas para avanzar en el proceso</div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex h-full gap-4 overflow-x-auto pb-4">
                    {COLUMNS.map((col) => (
                        <div key={col.id} className={`flex h-full w-80 min-w-[320px] flex-col rounded-lg border-t-4 bg-gray-50 p-3 shadow-sm ${col.color}`}>

                            {/* Encabezado Columna */}
                            <div className="mb-3 flex items-center justify-between px-2">
                                <h3 className="font-semibold text-gray-700">{col.title}</h3>
                                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-500 shadow-sm">
                                    {board && board[col.id]?.length}
                                </span>
                            </div>

                            {/* Área Droppable */}
                            <Droppable droppableId={col.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex-1 overflow-y-auto px-1"
                                    >
                                        {board && board[col.id]?.map((client, index) => (
                                            <Draggable key={client.id} draggableId={client.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => setSelectedClientId(client.id)}
                                                        className={`mb-3 cursor-pointer select-none rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="rounded bg-blue-100 p-1.5 text-blue-600">
                                                                    <LucideBuilding2 size={16} />
                                                                </div>
                                                                <span className="text-xs font-semibold text-blue-800">
                                                                    {client.company_name}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <h4 className="mt-2 text-sm font-medium text-gray-900">
                                                            {client.contact_name || 'Sin Contacto'}
                                                        </h4>

                                                        <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                                                            <LucideCalendarClock size={12} />
                                                            <span>Caduca: {client.assignment_expires_at ? new Date(client.assignment_expires_at).toLocaleDateString() : 'N/A'}</span>
                                                        </div>
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

            {selectedClientId && (
                <ClientModal
                    clientId={selectedClientId}
                    onClose={() => setSelectedClientId(null)}
                />
            )}
        </div>
    )
}