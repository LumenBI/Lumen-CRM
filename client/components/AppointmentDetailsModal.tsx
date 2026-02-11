'use client'

import { LucideX, LucideCalendar, LucideClock, LucideMapPin, LucideVideo, LucideUser, LucideAlignLeft } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ModalPortal from '@/components/ui/ModalPortal'
import { getTypeIcon } from '@/utils/appointmentUtils'

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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                            {getTypeIcon(appointment.appointment_type, 'md')}
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                {appointment.appointment_type}
                            </span>
                            <h2 className="text-lg font-bold text-[#000d42] line-clamp-1">
                                {appointment.title}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-white rounded-full"
                    >
                        <LucideX className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                            <div className="flex items-center gap-2 mb-1 text-blue-700">
                                <LucideCalendar className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase">Fecha</span>
                            </div>
                            <p className="font-semibold text-slate-700">
                                {formatDate(appointment.appointment_date)}
                            </p>
                        </div>
                        <div className="flex-1 bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                            <div className="flex items-center gap-2 mb-1 text-purple-700">
                                <LucideClock className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase">Hora</span>
                            </div>
                            <p className="font-semibold text-slate-700">
                                {appointment.appointment_time.slice(0, 5)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <div className="mt-1">
                            <LucideUser className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Cliente</p>
                            <p className="font-bold text-[#000d42]">{appointment.client.company_name}</p>
                            <p className="text-sm text-slate-600">{appointment.client.contact_name}</p>
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
                                <p className="text-sm font-medium text-slate-500">
                                    {appointment.appointment_type === 'virtual' ? 'Enlace de Reunión' : 'Ubicación'}
                                </p>
                                {appointment.appointment_type === 'virtual' ? (
                                    <a
                                        href={appointment.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline truncate block"
                                    >
                                        {appointment.meeting_link}
                                    </a>
                                ) : (
                                    <p className="text-slate-700">{appointment.location}</p>
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
                                <p className="text-sm font-medium text-slate-500">Descripción</p>
                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                    {appointment.description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-6 pt-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition shadow-sm"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex-1 py-2.5 bg-[#000d42] text-white font-medium rounded-xl hover:bg-[#001a66] transition shadow-lg shadow-blue-900/10"
                    >
                        Editar
                    </button>
                </div>
            </div>
        </ModalPortal>
    )
}
