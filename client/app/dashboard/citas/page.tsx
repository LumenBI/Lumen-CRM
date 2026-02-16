'use client'

import { useState, useEffect } from 'react'
import CreateAppointmentModal from '@/components/appointments/CreateAppointmentModal'
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal'
import CalendarView from '@/components/calendar/CalendarView'
import { useAppointments } from '@/context/AppointmentsContext'
import PageHeader from '@/components/ui/PageHeader'
import { getTypeIcon, getStatusBadge, formatAppointmentDate } from '@/utils/appointmentUtils'
import type { Appointment } from '@/types'
import { TEXTS } from '@/constants/text'
import { APPOINTMENT_STATUSES, getTypeLabel } from '@/constants/appointments'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ui/ConfirmModal'
import SegmentedControl from '@/components/ui/SegmentedControl'
import {
    LucideCalendar,
    LucidePlus,
    LucideList,
    LucideExternalLink,
    LucideEye,
    LucidePencil,
    LucideCheckCircle,
    LucideXCircle,
    LucideClock
} from 'lucide-react'
import ContextMenu from '@/components/ContextMenu'
import { useQuickActions } from '@/context/QuickActionsContext'

export default function AppointmentsPage() {
    const { appointments, loading, refreshAppointments, updateAppointment, updateAppointmentStatus } = useAppointments()
    const [filter, setFilter] = useState<'all' | 'pendiente' | 'confirmada' | 'completada'>('all')
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { requestAction, clearAction } = useQuickActions()

    useEffect(() => {
        if (requestAction === 'newAppointment') {
            setIsModalOpen(true)
            clearAction()
        }
    }, [requestAction, clearAction])
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean
        appointmentId: string | null
        status: 'completada' | 'cancelada' | null
        isLoading: boolean
    }>({
        isOpen: false,
        appointmentId: null,
        status: null,
        isLoading: false
    })

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
            toast.warning('Esta cita no tiene enlace de reunión virtual.')
        }
    }

    const handleUpdateStatus = async (appointmentId: string, status: 'completada' | 'cancelada') => {
        if (status === 'cancelada') {
            setConfirmModal({
                isOpen: true,
                appointmentId,
                status,
                isLoading: false
            })
            return
        }

        try {
            await updateAppointmentStatus(appointmentId, status)
            toast.success(`Cita marcada como ${status}`)
        } catch (error) {
            console.error(`Error updating appointment to ${status}:`, error)
            toast.error('Error al actualizar el estado')
        }
    }

    const handleConfirmStatusChange = async () => {
        if (!confirmModal.appointmentId || !confirmModal.status) return
        setConfirmModal(prev => ({ ...prev, isLoading: true }))
        try {
            await updateAppointmentStatus(confirmModal.appointmentId, confirmModal.status as any)
            toast.success('Cita cancelada correctamente')
            setConfirmModal({ isOpen: false, appointmentId: null, status: null, isLoading: false })
        } catch (error) {
            console.error('Error canceling appointment:', error)
            toast.error('Error al cancelar la cita')
            setConfirmModal(prev => ({ ...prev, isLoading: false }))
        }
    }

    const contextAppointment = getContextAppointment()

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

    return (
        <div className="space-y-6 p-4 md:p-8 dark:text-white transition-colors">
            <PageHeader
                title={TEXTS.CALENDAR_TITLE}
                subtitle="Gestiona tus reuniones y llamadas programadas"
                icon={LucideCalendar}
                actionLabel={TEXTS.NEW_APPOINTMENT}
                actionIcon={<LucidePlus size={20} />}
                onAction={() => {
                    setEditingAppointment(null)
                    setIsModalOpen(true)
                }}
                extraActions={
                    <SegmentedControl
                        value={viewMode}
                        onChange={(val: string) => setViewMode(val as 'calendar' | 'list')}
                        options={[
                            { label: 'Calendario', value: 'calendar', icon: LucideCalendar },
                            { label: 'Lista', value: 'list', icon: LucideList }
                        ]}
                    />
                }
            />

            <SegmentedControl
                value={filter || 'all'}
                onChange={(val: string) => setFilter(val === 'all' ? 'all' as any : val as any)}
                options={[
                    { label: `Todas (${appointments.length})`, value: 'all' },
                    ...APPOINTMENT_STATUSES.map(status => ({
                        label: `${status.label} (${appointments.filter(a => a.status === status.id).length})`,
                        value: status.id
                    }))
                ]}
            />

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
                                await updateAppointment(appointmentId, { appointment_date: newDate })
                                toast.success('Cita movida')
                            } catch (error) {
                                console.error('Error moving appointment:', error)
                                toast.error('Error al mover la cita')
                            }
                        }}
                    />
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Fecha & Hora</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Título</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-[#000d42] dark:text-blue-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
                                                onContextMenu={(e) => handleContextMenu(e, appointment.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold text-[#000d42] dark:text-white group-hover:text-[#0056fc] dark:group-hover:text-blue-400 transition-colors">{appointment.client.company_name}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{appointment.client.contact_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{formatAppointmentDate(appointment.appointment_date)}</span>
                                                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                            <LucideClock size={12} />
                                                            <span>{appointment.appointment_time.slice(0, 5)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600`}>
                                                        {getTypeLabel(appointment.appointment_type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-700 font-medium">{appointment.title}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setEditingAppointment(appointment)
                                                            setIsModalOpen(true)
                                                        }}
                                                        className="text-slate-400 hover:text-[#0056fc] transition-colors"
                                                    >
                                                        <LucidePencil size={18} />
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
                    refreshAppointments()
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
                            action: () => { if (contextAppointment) handleUpdateStatus(contextAppointment.id, 'completada') },
                            className: 'text-green-600 hover:bg-green-50',
                            disabled: contextAppointment?.status === 'completada'
                        },
                        {
                            label: 'Cancelar Cita',
                            icon: LucideXCircle,
                            action: () => { if (contextAppointment) handleUpdateStatus(contextAppointment.id, 'cancelada') },
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

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, appointmentId: null, status: null, isLoading: false })}
                onConfirm={handleConfirmStatusChange}
                isLoading={confirmModal.isLoading}
                title="Cancelar Cita"
                message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
                confirmText="Cancelar Cita"
                isDestructive={true}
            />
        </div>
    )
}
