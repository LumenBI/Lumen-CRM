'use client'

import { useState, useEffect } from 'react'
import CreateAppointmentModal from '@/components/CreateAppointmentModal'
import AppointmentDetailsModal from '@/components/AppointmentDetailsModal'
import CalendarView from '@/components/calendar/CalendarView'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import { getTypeIcon, getStatusBadge, formatAppointmentDate } from '@/utils/appointmentUtils'
import type { Appointment } from '@/types'
import {
    LucideCalendar,
    LucidePlus,
    LucideList,
    LucideExternalLink,
    LucideEye,
    LucidePencil,
    LucideCheckCircle,
    LucideXCircle
} from 'lucide-react'
import ContextMenu from '@/components/ContextMenu'

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pendiente' | 'confirmada' | 'completada'>('all')
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean
        x: number
        y: number
        appointmentId: string | null
        date: string | null
    }>({
        isOpen: false,
        x: 0,
        y: 0,
        appointmentId: null,
        date: null
    })

    const { authFetch } = useAuthFetch()

    useEffect(() => {
        fetchAppointments()
    }, [])

    async function fetchAppointments() {
        setLoading(true)
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments`)
            if (!res.ok) throw new Error('Failed to fetch appointments')
            const data = await res.json()
            setAppointments(data)
        } catch (error) {
            console.error('Error fetching appointments:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredAppointments = filter === 'all'
        ? appointments
        : appointments.filter(a => a.status === filter)

    const handleContextMenu = (e: React.MouseEvent, appointmentId: string) => {
        e.preventDefault()
        setContextMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            appointmentId,
            date: null
        })
    }

    const getContextAppointment = () => {
        if (!contextMenu.appointmentId) return null
        return appointments.find(a => a.id === contextMenu.appointmentId)
    }

    const handleJoinMeeting = (appointment: Appointment) => {
        if (appointment.appointment_type === 'virtual' && appointment.meeting_link) {
            window.open(appointment.meeting_link, '_blank')
        } else {
            alert('Esta cita no tiene enlace de reunión virtual.')
        }
    }

    /** Merged handler for both complete and cancel actions (were near-identical) */
    const updateAppointmentStatus = async (appointmentId: string, status: 'completada' | 'cancelada') => {
        if (status === 'cancelada' && !confirm('¿Estás seguro de que deseas cancelar esta cita?')) return

        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                fetchAppointments()
            } else {
                alert(status === 'completada' ? 'Error al actualizar el estado' : 'Error al cancelar la cita')
            }
        } catch (error) {
            console.error(`Error updating appointment to ${status}:`, error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Cargando citas...</p>
                </div>
            </div>
        )
    }

    // Cache the context appointment once for use in context menu items
    const contextAppointment = getContextAppointment()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#000d42]">Agenda de Citas</h1>
                    <p className="text-slate-500">Gestiona tus reuniones y llamadas programadas</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center shadow-sm">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'calendar'
                                ? 'bg-blue-50 text-[#0056fc]'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <LucideCalendar size={18} />
                            <span className="hidden sm:inline">Calendario</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'list'
                                ? 'bg-blue-50 text-[#0056fc]'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <LucideList size={18} />
                            <span className="hidden sm:inline">Lista</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-[#0056fc] text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 transition shadow-lg hover:shadow-xl hover:scale-105"
                    >
                        <LucidePlus className="h-5 w-5" />
                        <span className="hidden sm:inline">Nueva Cita</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'pendiente', 'confirmada', 'completada'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status as any)}
                        className={`px-4 py-2 rounded-xl whitespace-nowrap transition text-sm font-medium border ${filter === status
                            ? 'bg-[#0056fc] text-white border-[#0056fc]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                    >
                        {status === 'all' ? 'Todas' : status.charAt(0).toUpperCase() + status.slice(1)}
                        {status !== 'all' && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === status ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                                {appointments.filter(a => a.status === status).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {viewMode === 'calendar' ? (
                <div className="animate-in fade-in duration-300">
                    <CalendarView
                        appointments={filteredAppointments}
                        onAppointmentClick={(e, app) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedAppointment(app)
                            setIsDetailsOpen(true)
                        }}
                        onAppointmentContextMenu={(e, app) => {
                            setContextMenu({
                                isOpen: true,
                                x: e.clientX,
                                y: e.clientY,
                                appointmentId: app.id,
                                date: null
                            })
                        }}
                        onDateContextMenu={(e, date) => {
                            setContextMenu({
                                isOpen: true,
                                x: e.clientX,
                                y: e.clientY,
                                appointmentId: null,
                                date: date
                            })
                        }}
                        onAppointmentMove={async (appointmentId, newDate) => {
                            try {
                                setAppointments(prev => prev.map(app =>
                                    app.id === appointmentId ? { ...app, appointment_date: newDate } : app
                                ))

                                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments/${appointmentId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ appointment_date: newDate })
                                })

                                if (!res.ok) throw new Error('Failed to move appointment')

                                fetchAppointments()
                            } catch (error) {
                                console.error('Error moving appointment:', error)
                                alert('Error al mover la cita')
                                fetchAppointments()
                            }
                        }}
                    />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] uppercase tracking-wider">Fecha & Hora</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] uppercase tracking-wider">Título</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-[#000d42] uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No hay citas {filter !== 'all' ? `en estado "${filter}"` : ''}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAppointments.map((appointment) => {
                                        const badge = getStatusBadge(appointment.status)
                                        return (
                                            <tr
                                                key={appointment.id}
                                                className="hover:bg-slate-50 transition group"
                                                onContextMenu={(e) => handleContextMenu(e, appointment.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold text-[#000d42] group-hover:text-[#0056fc] transition-colors">{appointment.client.company_name}</p>
                                                        <p className="text-sm text-slate-500">{appointment.client.contact_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-700">{formatAppointmentDate(appointment.appointment_date)}</span>
                                                        <span className="text-xs text-slate-400 font-medium">{appointment.appointment_time.slice(0, 5)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        {getTypeIcon(appointment.appointment_type)}
                                                        <span className="text-sm capitalize font-medium">{appointment.appointment_type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-700 font-medium">{appointment.title}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-slate-400 hover:text-[#0056fc] transition p-2 hover:bg-blue-50 rounded-lg">
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <CreateAppointmentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingAppointment(null)
                }}
                onSuccess={() => {
                    fetchAppointments()
                    setIsModalOpen(false)
                    setEditingAppointment(null)
                }}
                initialData={editingAppointment}
            />

            <AppointmentDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                appointment={selectedAppointment}
                onEdit={() => {
                    if (selectedAppointment) {
                        setEditingAppointment(selectedAppointment)
                        setIsDetailsOpen(false)
                        setIsModalOpen(true)
                    }
                }}
            />

            {contextMenu.isOpen && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    title={contextAppointment?.title || 'Acciones'}
                    onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
                    items={contextMenu.appointmentId ? [
                        {
                            label: 'Entrar a Reunión',
                            icon: LucideExternalLink,
                            action: () => { if (contextAppointment) handleJoinMeeting(contextAppointment) },
                            disabled: contextAppointment?.appointment_type !== 'virtual'
                        },
                        {
                            label: 'Ver Detalles',
                            icon: LucideEye,
                            action: () => {
                                if (contextAppointment) {
                                    setSelectedAppointment(contextAppointment)
                                    setIsDetailsOpen(true)
                                }
                            }
                        },
                        {
                            label: 'Editar Cita',
                            icon: LucidePencil,
                            action: () => {
                                if (contextAppointment) {
                                    setEditingAppointment(contextAppointment)
                                    setIsModalOpen(true)
                                }
                            }
                        },
                        {
                            label: 'Marcar Completada',
                            icon: LucideCheckCircle,
                            action: () => { if (contextAppointment) updateAppointmentStatus(contextAppointment.id, 'completada') },
                            className: 'text-green-600 hover:bg-green-50',
                            disabled: contextAppointment?.status === 'completada'
                        },
                        {
                            label: 'Cancelar Cita',
                            icon: LucideXCircle,
                            action: () => { if (contextAppointment) updateAppointmentStatus(contextAppointment.id, 'cancelada') },
                            className: 'text-red-600 hover:bg-red-50',
                            disabled: contextAppointment?.status === 'cancelada'
                        }
                    ] : [
                        {
                            label: 'Crear Cita Aquí',
                            icon: LucidePlus,
                            action: () => {
                                if (contextMenu.date) {
                                    setEditingAppointment({
                                        appointment_date: contextMenu.date
                                    } as any)
                                    setIsModalOpen(true)
                                }
                            }
                        }
                    ]}
                />
            )}
        </div>
    )
}
