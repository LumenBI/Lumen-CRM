'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { LucideCalendar, LucideVideo, LucideMapPin, LucidePhone, LucideClock } from 'lucide-react'

interface UpcomingAppointment {
    id: string
    title: string
    appointment_date: string
    appointment_time: string
    appointment_type: 'virtual' | 'presencial' | 'llamada'
    status: 'pendiente' | 'confirmada'
    client: {
        company_name: string
        contact_name: string
    }
}

export default function UpcomingAppointmentsWidget() {
    const [appointments, setAppointments] = useState<UpcomingAppointment[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        fetchUpcomingAppointments()
    }, [])

    async function fetchUpcomingAppointments() {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const token = session.access_token
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments/upcoming?limit=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) throw new Error('Failed to fetch appointments')

            const data = await res.json()
            setAppointments(data)
        } catch (error) {
            console.error('Error fetching upcoming appointments:', error)
        } finally {
            setLoading(false)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'virtual': return <LucideVideo className="h-4 w-4 text-[#0056fc]" />
            case 'presencial': return <LucideMapPin className="h-4 w-4 text-purple-600" />
            case 'llamada': return <LucidePhone className="h-4 w-4 text-emerald-600" />
            default: return <LucideClock className="h-4 w-4 text-slate-500" />
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        const day = date.getDate() + 1 // Offset issue fix
        const month = date.toLocaleString('es-ES', { month: 'short' })
        return { day, month }
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#000d42]">Próximas Citas</h3>
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
                <h3 className="text-lg font-bold text-[#000d42]">Próximas Citas</h3>
                <Link
                    href="/dashboard/citas"
                    className="text-sm text-[#0056fc] hover:underline flex items-center gap-1"
                >
                    Ver todas
                    <LucideCalendar className="h-4 w-4" />
                </Link>
            </div>

            {appointments.length === 0 ? (
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
                    {appointments.map((appointment) => {
                        const { day, month } = formatDate(appointment.appointment_date)
                        return (
                            <div key={appointment.id} className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition border-b border-slate-100 last:border-0">
                                <div className="bg-blue-100 text-[#000d42] font-bold rounded-lg p-3 text-center min-w-[60px]">
                                    <span className="block text-xs uppercase">{month}</span>
                                    <span className="block text-lg leading-none">{day}</span>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h4 className="font-bold text-slate-700">{appointment.client.company_name}</h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        {getTypeIcon(appointment.appointment_type)}
                                        <span>{appointment.appointment_time}</span>
                                        <span className="mx-1">•</span>
                                        <span className="capitalize">{appointment.appointment_type}</span>
                                    </p>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${appointment.status === 'confirmada'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {appointment.status === 'confirmada' ? '✓' : '⏱'}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
