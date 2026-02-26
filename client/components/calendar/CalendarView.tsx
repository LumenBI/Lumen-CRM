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
import { DAYS, MONTHS } from '@/constants/calendar'
import { APPOINTMENT_TYPES, getStatusCalendarColor } from '@/constants/appointments'
import type { Appointment } from '@/types'



interface CalendarViewProps {
    appointments: Appointment[]
    onAppointmentClick?: (e: React.MouseEvent, appointment: Appointment) => void
    onAppointmentContextMenu?: (e: React.MouseEvent, appointment: Appointment) => void
    onDateContextMenu?: (e: React.MouseEvent, date: string) => void
    onAppointmentMove?: (appointmentId: string, newDate: string) => void
}


const TYPE_ICON_MAP: Record<string, typeof LucideVideo> = {
    'LucideVideo': LucideVideo,
    'LucideMapPin': LucideMapPin,
    'LucidePhone': LucidePhone,
}

function getTypeIcon(type: string) {
    const typeConfig = APPOINTMENT_TYPES.find(t => t.id === type)
    const Icon = typeConfig ? TYPE_ICON_MAP[typeConfig.iconName] : LucideClock
    return Icon ? <Icon className="h-3 w-3" /> : <LucideClock className="h-3 w-3" />
}

export default function CalendarView({ appointments, onAppointmentClick, onAppointmentContextMenu, onDateContextMenu, onAppointmentMove }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay()
    }

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const todayStr = new Date().toISOString().split('T')[0]

    const blanks = Array(firstDay).fill(null)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const totalSlots = [...blanks, ...days]

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-[#000d42] dark:text-white">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    {MONTHS[month]} <span className="text-slate-400 dark:text-slate-500 font-normal">{year}</span>
                </h2>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition shadow-sm">
                        <LucideChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-semibold hover:bg-white dark:hover:bg-slate-700 rounded-md transition">
                        Hoy
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition shadow-sm">
                        <LucideChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {DAYS.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold uppercase text-slate-500 tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] divide-x divide-slate-100 dark:divide-slate-800 divide-y">
                {totalSlots.map((day, index) => {
                    if (!day) return <div key={`blank-${index}`} className="bg-slate-50/50 dark:bg-slate-800/30" />

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
                                e.preventDefault()
                                e.currentTarget.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'ring-2', 'ring-blue-200', 'dark:ring-blue-800', 'ring-inset')
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'ring-2', 'ring-blue-200', 'dark:ring-blue-800', 'ring-inset')
                            }}
                            onDrop={(e) => {
                                e.preventDefault()
                                e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'ring-2', 'ring-blue-200', 'dark:ring-blue-800', 'ring-inset')
                                const appointmentId = e.dataTransfer.getData('text/plain')
                                if (appointmentId && onAppointmentMove) {
                                    onAppointmentMove(appointmentId, dateString)
                                }
                            }}
                            className={`p-2 relative group hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''} min-h-[120px]`}
                        >
                            <div className="flex justify-between items-start mb-1 pointer-events-none">
                                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${isToday ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'text-slate-700 dark:text-slate-400'}`}>
                                    {day}
                                </span>
                                {dayAppointments.length > 0 && (
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 rounded-full">
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
                                        className={`w-full text-left p-1.5 rounded-md border text-[10px] sm:text-xs transition hover:scale-[1.02] shadow-sm ${getStatusCalendarColor(app.status)} cursor-grab active:cursor-grabbing`}
                                    >
                                        <div className="flex items-center gap-1 mb-0.5 line-clamp-1 font-bold pointer-events-none">
                                            {getTypeIcon(app.appointment_type)}
                                            {app.appointment_time?.slice(0, 5) ?? '--:--'}
                                        </div>
                                        <div className="line-clamp-1 opacity-90 pointer-events-none">
                                            {app.client?.company_name ?? app.title ?? 'Sin cliente'}
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
