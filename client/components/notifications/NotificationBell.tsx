'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell } from 'lucide-react'
import Link from 'next/link'

type Notification = {
    id: string
    created_at: string
    type: string
    message: string
    link?: string
    is_read: boolean
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        let channel: any

        const setup = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) {
                setNotifications(data)
                setUnreadCount(data.length)
            }

            channel = supabase
                .channel('notifications-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${session.user.id}`
                    },
                    (payload) => {
                        const newNotif = payload.new as Notification
                        setNotifications(prev => [newNotif, ...prev])
                        setUnreadCount(prev => prev + 1)
                    }
                )
                .subscribe()
        }

        setup()

        // Initial check and then every 5 minutes
        const checkReminders = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                if (process.env.NEXT_PUBLIC_API_URL) {
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/notifications/check`, {
                            headers: { 'Authorization': `Bearer ${session.access_token}` }
                        })
                    } catch (err) {
                        console.error('Failed to fetch notifications check:', err)
                    }
                }
            }
        }

        checkReminders() // Initial call
        const interval = setInterval(checkReminders, 5 * 60 * 1000)

        return () => {
            if (channel) supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMarkAsRead = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
        setUnreadCount(prev => Math.max(0, prev - 1))

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', session.user.id)
    }

    const handleMarkAllRead = async () => {
        const ids = notifications.map(n => n.id)
        setNotifications([])
        setUnreadCount(0)
        setIsOpen(false)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', ids)
            .eq('user_id', session.user.id)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-400 hover:text-[#0066FF] dark:hover:text-blue-400"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] md:w-80 origin-top-right rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-[#0066FF] dark:text-blue-400 hover:underline font-bold"
                            >
                                Marcar todo leído
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto py-2">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400 text-sm">
                                <p>No tienes notificaciones nuevas</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 relative group">
                                    <div onClick={() => handleMarkAsRead(notif.id)} className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 cursor-pointer p-1 text-gray-400 dark:text-slate-500 hover:text-blue-50 dark:hover:text-blue-400 transition-all">
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Leída</span>
                                    </div>
                                    <Link href={notif.link || '#'} onClick={() => notif.link && handleMarkAsRead(notif.id)}>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 pr-6">
                                            {(() => {
                                                const match = notif.message.match(/^\[(.*?)\]\s*(.*)$/);
                                                if (match) {
                                                    return (
                                                        <>
                                                            <span className="text-[#0066FF] dark:text-blue-400 font-bold">{match[1]}</span>
                                                            {' '}{match[2]}
                                                        </>
                                                    );
                                                }
                                                return notif.message;
                                            })()}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1 uppercase font-bold">
                                            {new Date(notif.created_at).toLocaleDateString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl text-center">
                        <Link href="/dashboard/notifications" className="text-[10px] font-bold text-gray-500 dark:text-slate-400 hover:text-[#0066FF] dark:hover:text-blue-400 transition-colors uppercase tracking-widest">
                            Ver historial completo
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
