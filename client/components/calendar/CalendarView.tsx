'use client'

import { useState } from 'react'
import {
    LucideChevronLeft,
    LucideChevronRight,
    LucideVideo,
    LucideMapPin,
    LucidePhone,
    LucideClock
} from 'lucide-react'

interface Appointment {
    id: string
    title: string
    appointment_date: string
    appointment_time: string
    appointment_type: 'virtual' | 'presencial' | 'llamada'
    status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
    client: {
        id: string
        company_name: string
        contact_name: string
    }
}

interface CalendarViewProps {
    appointments: Appointment[]
    onAppointmentClick?: (e: React.MouseEvent, appointment: Appointment) => void
    onAppointmentContextMenu?: (e: React.MouseEvent, appointment: Appointment) => void
    onDateContextMenu?: (e: React.MouseEvent, date: string) => void
    onAppointmentMove?: (appointmentId: string, newDate: string) => void
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function CalendarView({ appointments, onAppointmentClick, onAppointmentContextMenu, onDateContextMenu, onAppointmentMove }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay()
    }

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() // 0-indexed

    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // Helpers for rendering
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'virtual': return <LucideVideo className="h-3 w-3" />
            case 'presencial': return <LucideMapPin className="h-3 w-3" />
            case 'llamada': return <LucidePhone className="h-3 w-3" />
            default: return <LucideClock className="h-3 w-3" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmada': return 'bg-green-100 text-green-700 border-green-200'
            case 'pendiente': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'cancelada': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    // Grid Generation
    const blanks = Array(firstDay).fill(null)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const totalSlots = [...blanks, ...days]

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-[#000d42]">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    {MONTHS[month]} <span className="text-slate-400 font-normal">{year}</span>
                </h2>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-white rounded-md transition shadow-sm">
                        <LucideChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-semibold hover:bg-white rounded-md transition">
                        Hoy
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-white rounded-md transition shadow-sm">
                        <LucideChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                {DAYS.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold uppercase text-slate-500 tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] divide-x divide-slate-100 divide-y">
                {totalSlots.map((day, index) => {
                    if (!day) return <div key={`blank-${index}`} className="bg-slate-50/50" />

                    // Format date string YYYY-MM-DD for comparison
                    // Note: month is 0-indexed, so month + 1. PadStart to ensure 2 digits.
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isToday = dateString === todayStr

                    const dayAppointments = appointments.filter(app => app.appointment_date === dateString)

                    return (
                        <div
                            key={day}
                            onContextMenu={(e) => {
                                if (onDateContextMenu) {
                                    e.preventDefault()
                                    onDateContextMenu(e, dateString)
                                }
                            }}
                            onDragOver={(e) => {
                                e.preventDefault() // Allow dropping
                                e.currentTarget.classList.add('bg-blue-50', 'ring-2', 'ring-blue-200', 'ring-inset')
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('bg-blue-50', 'ring-2', 'ring-blue-200', 'ring-inset')
                            }}
                            onDrop={(e) => {
                                e.preventDefault()
                                e.currentTarget.classList.remove('bg-blue-50', 'ring-2', 'ring-blue-200', 'ring-inset')
                                const appointmentId = e.dataTransfer.getData('text/plain')
                                if (appointmentId && onAppointmentMove) {
                                    onAppointmentMove(appointmentId, dateString)
                                }
                            }}
                            className={`p-2 relative group hover:bg-blue-50/20 transition-all ${isToday ? 'bg-blue-50/50' : ''} min-h-[120px]`}
                        >
                            <div className="flex justify-between items-start mb-1 pointer-events-none">
                                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${isToday ? 'bg-[#0056fc] text-white' : 'text-slate-700'}`}>
                                    {day}
                                </span>
                                {dayAppointments.length > 0 && (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded-full">
                                        {dayAppointments.length}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                                {dayAppointments.map(app => (
                                    <div
                                        key={app.id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', app.id)
                                            e.dataTransfer.effectAllowed = 'move'
                                        }}
                                        onClick={(e) => onAppointmentClick && onAppointmentClick(e, app)}
                                        onContextMenu={(e) => {
                                            if (onAppointmentContextMenu) {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                onAppointmentContextMenu(e, app)
                                            }
                                        }}
                                        className={`w-full text-left p-1.5 rounded-md border text-[10px] sm:text-xs transition hover:scale-[1.02] shadow-sm ${getStatusColor(app.status)} cursor-grab active:cursor-grabbing`}
                                    >
                                        <div className="flex items-center gap-1 mb-0.5 line-clamp-1 font-bold pointer-events-none">
                                            {getTypeIcon(app.appointment_type)}
                                            {app.appointment_time.slice(0, 5)}
                                        </div>
                                        <div className="line-clamp-1 opacity-90 pointer-events-none">
                                            {app.client.company_name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
