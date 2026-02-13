'use client'

import { LucideX, LucideCalendar, LucideClock, LucideMapPin, LucideVideo, LucideUser, LucideAlignLeft } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'
import ModalPortal from '@/components/ui/ModalPortal'
import { getTypeIcon } from '@/utils/appointmentUtils'
import { getTypeLabel } from '@/constants/appointments'

interface AppointmentDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    appointment: any
    onEdit: () => void
}

export default function AppointmentDetailsModal({ isOpen, onClose, appointment, onEdit }: AppointmentDetailsModalProps) {
    if (!isOpen || !appointment) return null

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return format(date, "d 'de' MMMM, yyyy", { locale: es })
    }

    return (
        <ModalPortal onBackdropClick={onClose} backdropClassName="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                            {getTypeIcon(appointment.appointment_type, 'md')}
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                {getTypeLabel(appointment.appointment_type)}
                            </span>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                                {appointment.title}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full"
                    >
                        <LucideX className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                            <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-400">
                                <LucideCalendar className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase">Fecha</span>
                            </div>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                                {formatDate(appointment.appointment_date)}
                            </p>
                        </div>
                        <div className="flex-1 bg-purple-50/50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100/50 dark:border-purple-800/30">
                            <div className="flex items-center gap-2 mb-1 text-purple-700 dark:text-purple-400">
                                <LucideClock className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase">Hora</span>
                            </div>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                                {appointment.appointment_time.slice(0, 5)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex gap-3 items-start">
                            <div className="mt-1">
                                <LucideUser className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Agente Responsable</p>
                                <p className="font-bold text-gray-900 dark:text-white">{appointment.agent?.full_name || 'Asignado'}</p>
                            </div>
                        </div>

                        {appointment.participants && appointment.participants.length > 0 && (
                            <div className="col-span-1 sm:col-span-2 space-y-2">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Participantes</p>
                                <div className="flex flex-wrap gap-2">
                                    {appointment.participants.map((p: any) => (
                                        <div key={p.user?.id || p.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <div className="bg-white dark:bg-slate-700 p-1 rounded-full shadow-sm">
                                                <LucideUser className="h-3 w-3 text-slate-400 dark:text-slate-300" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {p.user?.full_name || p.full_name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 items-start border-t border-slate-50 dark:border-slate-800 pt-4">
                        <div className="mt-1">
                            <LucideUser className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cliente</p>
                            <p className="font-bold text-gray-900 dark:text-white">{appointment.client.company_name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{appointment.client.contact_name}</p>
                        </div>
                    </div>

                    {(appointment.location || appointment.meeting_link) && (
                        <div className="flex gap-3 items-start">
                            <div className="mt-1">
                                {appointment.appointment_type === 'virtual'
                                    ? <LucideVideo className="h-5 w-5 text-slate-400" />
                                    : <LucideMapPin className="h-5 w-5 text-slate-400" />
                                }
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {appointment.appointment_type === 'virtual' ? 'Enlace de Reunión' : 'Ubicación'}
                                </p>
                                {appointment.appointment_type === 'virtual' ? (
                                    <a
                                        href={appointment.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                                    >
                                        {appointment.meeting_link}
                                    </a>
                                ) : (
                                    <p className="text-slate-700 dark:text-slate-300">{appointment.location}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {appointment.description && (
                        <div className="flex gap-3 items-start">
                            <div className="mt-1">
                                <LucideAlignLeft className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Descripción</p>
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {appointment.description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 pt-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition shadow-sm"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex-1 py-2.5 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/10"
                    >
                        Editar
                    </button>
                </div>
            </div>
        </ModalPortal>
    )
}
