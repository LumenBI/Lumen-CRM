'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { LucideCalendar } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { getTypeIcon, getStatusBadge } from '@/utils/appointmentUtils'
import { getTypeLabel } from '@/constants/appointments'

export default function UpcomingAppointmentsWidget() {
    const { appointments, loading } = useData()

    const upcomingAppointments = useMemo(() => {
        if (!appointments) return []
        const now = new Date()
        return appointments
            .filter(app => new Date(app.appointment_date + 'T' + app.appointment_time) >= now)
            .sort((a, b) => new Date(a.appointment_date + 'T' + a.appointment_time).getTime() - new Date(b.appointment_date + 'T' + b.appointment_time).getTime())
            .slice(0, 3)
    }, [appointments])

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        const monthName = date.toLocaleString('es-ES', { month: 'short' })
        return { day, month: monthName }
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#000d42]">Próximas citas</h3>
                    <LucideCalendar className="h-5 w-5 text-[#0056fc]" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex items-center p-3 bg-slate-50 rounded-lg">
                            <div className="bg-slate-200 rounded-lg h-14 w-14 mr-4"></div>
                            <div className="flex-1 space-y-2">
                                <div className="bg-slate-200 h-4 w-3/4 rounded"></div>
                                <div className="bg-slate-200 h-3 w-1/2 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#000d42]">Próximas citas</h3>
                <Link
                    href="/dashboard/citas"
                    className="text-sm text-[#0056fc] hover:underline flex items-center gap-1"
                >
                    Ver todas
                    <LucideCalendar className="h-4 w-4" />
                </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <LucideCalendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay citas programadas</p>
                    <Link
                        href="/dashboard/citas"
                        className="text-xs text-[#0056fc] hover:underline mt-2 inline-block"
                    >
                        Agendar primera cita
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => {
                        const { day, month } = formatDate(appointment.appointment_date)
                        const linkHref = appointment.meeting_link || '/dashboard/citas'
                        const isExternal = !!appointment.meeting_link

                        return (
                            <Link
                                key={appointment.id}
                                href={linkHref}
                                target={isExternal ? '_blank' : undefined}
                                rel={isExternal ? 'noopener noreferrer' : undefined}
                                className="block group"
                            >
                                <div className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition border-b border-slate-100 last:border-0 group-hover:scale-[1.02] group-hover:shadow-sm">
                                    <div className="bg-blue-100 text-[#000d42] font-bold rounded-lg p-3 text-center min-w-[60px] group-hover:bg-[#0056fc] group-hover:text-white transition-colors">
                                        <span className="block text-xs uppercase">{month}</span>
                                        <span className="block text-lg leading-none">{day}</span>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h4 className="font-bold text-slate-700 group-hover:text-[#0056fc] transition-colors">{appointment.client.company_name}</h4>
                                        <div className="flex items-center gap-1 text-sm text-slate-600 mb-0.5">
                                            <span className="font-medium">con: {appointment.client.contact_name}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            {getTypeIcon(appointment.appointment_type)}
                                            <span>{appointment.appointment_time.slice(0, 5)}</span>
                                            <span className="mx-1">•</span>
                                            <span className="capitalize">{getTypeLabel(appointment.appointment_type)}</span>
                                        </p>
                                    </div>
                                    {(() => {
                                        const badge = getStatusBadge(appointment.status)
                                        return (
                                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                                                {appointment.status === 'confirmada' ? '✓' : '⏱'}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
