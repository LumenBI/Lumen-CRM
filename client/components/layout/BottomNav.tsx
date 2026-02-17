'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LucideLayoutDashboard,
    LucideKanban,
    LucideCalendar,
    LucideUsers,
    LucideMoreHorizontal,
    LucidePlus,
    LucideBriefcase,
    LucideFileText,
    LucideMail,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import MobileMoreSheet from './MobileMoreSheet'
import { TEXTS } from '@/constants/text'
import { useQuickActions } from '@/context/QuickActionsContext'

const MAIN_NAV_ITEMS = [
    { name: 'Resumen', href: '/dashboard', icon: LucideLayoutDashboard },
    { name: 'Seguimientos', href: '/dashboard/kanban', icon: LucideKanban },
    { name: 'Agenda', href: '/dashboard/citas', icon: LucideCalendar },
    { name: 'Clientes', href: '/dashboard/clients', icon: LucideUsers },
]

const QUICK_ACTIONS = [
    { label: TEXTS.NEW_CLIENT, icon: LucideUsers, action: 'newClient' as const },
    { label: TEXTS.NEW_DEAL, icon: LucideBriefcase, action: 'newDeal' as const },
    { label: TEXTS.SCHEDULE_APPOINTMENT, icon: LucideCalendar, action: 'newAppointment' as const },
    // { label: TEXTS.ADD_QUOTE, icon: LucideFileText, action: 'newQuote' as const },
    // { label: TEXTS.WRITE_EMAIL, icon: LucideMail, action: 'newEmail' as const },
]

export default function BottomNav() {
    const pathname = usePathname()
    const { requestNewClient, requestNewDeal, requestNewAppointment, requestNewQuote, requestNewEmail } = useQuickActions()
    const [isMoreOpen, setIsMoreOpen] = useState(false)
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false)
    const fabMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (fabMenuRef.current && !fabMenuRef.current.contains(e.target as Node)) {
                setIsFabMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(href)
    }

    return (
        <>
            <nav
                className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
                <div className="flex items-stretch w-full h-16">
                    {MAIN_NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 px-0.5 transition-colors touch-manipulation ${active
                                    ? 'text-[#0066FF] dark:text-blue-400'
                                    : 'text-gray-500 dark:text-slate-400'
                                    }`}
                            >
                                <Icon
                                    size={22}
                                    className={active ? 'text-[#0066FF] dark:text-blue-400' : ''}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span className="text-[10px] font-medium mt-0.5 truncate w-full text-center">
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}

                    <button
                        onClick={() => setIsMoreOpen(true)}
                        className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 px-0.5 transition-colors touch-manipulation ${isMoreOpen || pathname.startsWith('/dashboard/mail') ||
                            pathname.startsWith('/dashboard/reports') ||
                            pathname.startsWith('/dashboard/quotes') ||
                            pathname.startsWith('/dashboard/users') ||
                            pathname.startsWith('/dashboard/settings')
                            ? 'text-[#0066FF] dark:text-blue-400'
                            : 'text-gray-500 dark:text-slate-400'
                            }`}
                    >
                        <LucideMoreHorizontal size={22} strokeWidth={2} />
                        <span className="text-[10px] font-medium mt-0.5 truncate w-full text-center">
                            Más
                        </span>
                    </button>
                </div>
            </nav>

            <MobileMoreSheet
                isOpen={isMoreOpen}
                onClose={() => setIsMoreOpen(false)}
                pathname={pathname}
            />

            {/* FAB: botón + circular en la esquina inferior derecha (solo móvil) */}
            <div className="md:hidden fixed right-4 z-50" ref={fabMenuRef} style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
                <button
                    onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                    aria-label="Acciones rápidas"
                >
                    <LucidePlus size={24} strokeWidth={2.5} />
                </button>
                {isFabMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 py-2 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            {TEXTS.QUICK_ACTIONS}
                        </div>
                        {QUICK_ACTIONS.map((action, idx) => {
                            const Icon = action.icon
                            const handlers = {
                                newClient: requestNewClient,
                                newDeal: requestNewDeal,
                                newAppointment: requestNewAppointment,
                                newQuote: requestNewQuote,
                                newEmail: requestNewEmail,
                            }
                            return (
                                <button
                                    key={idx}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors text-left"
                                    onClick={() => {
                                        setIsFabMenuOpen(false)
                                        handlers[action.action]()
                                    }}
                                >
                                    <Icon size={18} className="text-blue-600 dark:text-blue-400" />
                                    {action.label}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}
