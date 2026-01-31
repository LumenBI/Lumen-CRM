'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import CreateAppointmentModal from '@/components/CreateAppointmentModal'
import CalendarView from '@/components/calendar/CalendarView'
import {
    LucideCalendar,
    LucidePhone,
    LucideVideo,
    LucideMapPin,
    LucidePlus,
    LucideCheck,
    LucideX,
    LucideClock,
    LucideLayoutGrid,
    LucideList
} from 'lucide-react'

interface Appointment {
    id: string
    title: string
    description?: string
    appointment_date: string
    appointment_time: string
    appointment_type: 'virtual' | 'presencial' | 'llamada'
    status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
    meeting_link?: string
    location?: string
    client: {
        id: string
        company_name: string
        contact_name: string
        phone?: string
        email?: string
    }
}

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pendiente' | 'confirmada' | 'completada'>('all')
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar') // Default to calendar
    const [isModalOpen, setIsModalOpen] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchAppointments()
    }, [])

    async function fetchAppointments() {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const token = session.access_token
            const url = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/appointments`

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

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

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'virtual': return <LucideVideo className="h-4 w-4" />
            case 'presencial': return <LucideMapPin className="h-4 w-4" />
            case 'llamada': return <LucidePhone className="h-4 w-4" />
            default: return <LucideClock className="h-4 w-4" />
        }
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            pendiente: 'bg-orange-100 text-orange-700',
            confirmada: 'bg-green-100 text-green-700',
            completada: 'bg-slate-100 text-slate-600',
            cancelada: 'bg-red-100 text-red-700'
        }
        return styles[status as keyof typeof styles] || styles.pendiente
    }

    const formatDate = (dateStr: string) => {
        // Fix for date parsing to avoid timezone offset
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
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

            {/* Filters (Only show for list view or apply to both? Let's apply to both for consistency, or maybe just list?)
                Actually, filters are useful for calendar too to see only 'pending' etc.
            */}
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
                        onAppointmentClick={(app) => {
                            // Ideally show detail modal here. For now alert or could reuse edit functionality logic
                            // To keep it premium, maybe just console log or TODO
                            console.log("Clicked appointment", app)
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
                                    filteredAppointments.map((appointment) => (
                                        <tr key={appointment.id} className="hover:bg-slate-50 transition group">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-[#000d42] group-hover:text-[#0056fc] transition-colors">{appointment.client.company_name}</p>
                                                    <p className="text-sm text-slate-500">{appointment.client.contact_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-700">{formatDate(appointment.appointment_date)}</span>
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
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(appointment.status).replace('bg-', 'bg-opacity-10 border-')}`}>
                                                    <span className={getStatusBadge(appointment.status).split(' ')[1]}>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-[#0056fc] transition p-2 hover:bg-blue-50 rounded-lg">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Appointment Modal */}
            <CreateAppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAppointments}
            />
        </div>
    )
}
