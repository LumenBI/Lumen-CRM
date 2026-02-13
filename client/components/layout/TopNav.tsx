'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Bell,
    Search,
    Plus,
    User,
    Settings,
    LogOut,
    Menu,
    ChevronRight,
    Briefcase,
    Users,
    Calendar
} from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { useQuickActions } from '@/context/QuickActionsContext'
import NotificationBell from '@/components/notifications/NotificationBell'
import { createClient as createSupabaseClient } from '@/utils/supabase/client'
import { useClients } from '@/context/ClientsContext'
import { TEXTS, NAVIGATION_LABELS } from '@/constants/text'

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': NAVIGATION_LABELS.SUMMARY,
    '/dashboard/kanban': NAVIGATION_LABELS.SALES,
    '/dashboard/citas': NAVIGATION_LABELS.CALENDAR,
    '/dashboard/clients': NAVIGATION_LABELS.CLIENTS,
    '/dashboard/users': NAVIGATION_LABELS.USERS,
}

const QUICK_ACTIONS = [
    { label: TEXTS.NEW_CLIENT, icon: Users, handler: 'requestNewClient' as const },
    { label: TEXTS.NEW_DEAL, icon: Briefcase, handler: 'requestNewDeal' as const },
    { label: TEXTS.SCHEDULE_APPOINTMENT, icon: Calendar, handler: 'requestNewAppointment' as const },
]

export default function TopNav() {
    const pathname = usePathname()
    const router = useRouter()
    const { requestNewClient, requestNewDeal, requestNewAppointment } = useQuickActions()
    const { profile, logout } = useUser()
    const [isUserOpen, setIsUserOpen] = useState(false)
    const [isQuickOpen, setIsQuickOpen] = useState(false)
    const userDropdownRef = useRef<HTMLDivElement>(null)
    const quickDropdownRef = useRef<HTMLDivElement>(null)
    const supabase = createSupabaseClient()
    const { createClient } = useClients()

    const handleLogout = async () => {
        await logout()
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setIsUserOpen(false)
            }
            if (quickDropdownRef.current && !quickDropdownRef.current.contains(event.target as Node)) {
                setIsQuickOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const pageTitle = PAGE_TITLES[pathname] || 'Dashboard'

    return (
        <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shrink-0 z-30 sticky top-0 transition-colors duration-300">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                <ChevronRight size={14} />
                <span className="font-bold text-gray-900 dark:text-white">{pageTitle}</span>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative mr-2 hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder={TEXTS.SEARCH}
                        className="h-9 w-64 rounded-full bg-gray-50 dark:bg-slate-800 border-none dark:border-slate-700 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white transition-all outline-none"
                    />
                </div>

                <div className="relative hidden md:block" ref={quickDropdownRef}>
                    <button
                        onClick={() => setIsQuickOpen(!isQuickOpen)}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Plus size={20} />
                    </button>

                    {isQuickOpen && (
                        <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-100 transform origin-top-right">
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                {TEXTS.QUICK_ACTIONS}
                            </div>
                            {QUICK_ACTIONS.map((action, idx) => {
                                const handler = { requestNewClient, requestNewDeal, requestNewAppointment }[action.handler]
                                return (
                                    <button
                                        key={idx}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors text-left"
                                        onClick={() => {
                                            setIsQuickOpen(false)
                                            handler()
                                        }}
                                    >
                                        <action.icon size={16} />
                                        {action.label}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-200 dark:bg-slate-800 mx-2" />

                <NotificationBell />

                <div className="relative ml-2" ref={userDropdownRef}>
                    <button
                        onClick={() => setIsUserOpen(!isUserOpen)}
                        className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
                            <img
                                src="/logos/star-logo.jpg"
                                alt="User"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="hidden md:block text-left mr-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                                {profile?.full_name || 'Usuario'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                {profile?.role || 'Agente'}
                            </p>
                        </div>
                    </button>

                    {isUserOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-100 transform origin-top-right">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                                <p className="font-semibold text-gray-900 dark:text-white">{profile?.full_name || 'Usuario'}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{profile?.email}</p>
                            </div>
                            <div className="p-2">
                                <Link
                                    href="/dashboard/settings"
                                    prefetch={false}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                    onClick={() => setIsUserOpen(false)}
                                >
                                    <Settings size={16} />
                                    {TEXTS.SETTINGS}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <LogOut size={16} />
                                    {TEXTS.LOGOUT}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
