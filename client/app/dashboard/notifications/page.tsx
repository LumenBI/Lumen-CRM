'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, Check, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'

type Notification = {
    id: string
    created_at: string
    type: string
    message: string
    link?: string
    is_read: boolean
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) {
            setNotifications(data)
        }
        setLoading(false)
    }

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', session.user.id)
    }

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
        if (unreadIds.length === 0) return

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds)
            .eq('user_id', session.user.id)
    }

    const deleteNotification = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', session.user.id)
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Bell className="text-blue-600" size={32} />
                            Centro de Notificaciones
                        </h1>
                        <p className="text-gray-500 mt-1">Historial de alertas y actualizaciones</p>
                    </div>
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium transition-colors shadow-sm"
                    >
                        <Check size={18} />
                        Marcar todo como leído
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Bell size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Sin notificaciones</h3>
                            <p className="text-gray-500 mt-1">No tienes notificaciones recientes.</p>
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`p-6 flex items-start justify-between gap-4 transition-colors hover:bg-gray-50/50 ${!notification.is_read ? 'bg-blue-50/40' : ''}`}
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                    <div>
                                        <p className="text-gray-900 font-medium mb-1">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span>{new Date(notification.created_at).toLocaleDateString('es-ES', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                            {notification.link && (
                                                <Link
                                                    href={notification.link}
                                                    className="text-blue-600 hover:underline font-medium"
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    Ver detalles
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!notification.is_read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                            title="Marcar como leída"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
