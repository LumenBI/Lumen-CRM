'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LucideLogOut,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Toaster } from '@/components/ui/sonner'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import { MENU_ITEMS, SYSTEM_ITEMS } from '@/constants/text'
import { UserProvider } from '@/context/UserContext'
import { DataProvider } from '@/context/DataContext'
import { ClientsProvider } from '@/context/ClientsContext'
import { AgentsProvider } from '@/context/AgentsContext'
import { AppointmentsProvider } from '@/context/AppointmentsContext'
import { DealsProvider } from '@/context/DealsContext'
import { QuickActionsProvider } from '@/context/QuickActionsContext'
import { useTheme } from 'next-themes'

const Sidebar = React.memo(({ pathname, menuItems, systemItems, logoSrc, onLogout }: {
    pathname: string,
    menuItems: any[],
    systemItems: any[],
    logoSrc: string,
    onLogout: () => void
}) => (
    <aside className="hidden w-64 flex-col border-r border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm md:flex transition-colors duration-300">
        <div className="flex h-16 items-center px-6 border-b border-gray-100 dark:border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-3">
                <img src={logoSrc} alt="Star CRM" className="h-8 object-contain" />
            </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {menuItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${pathname === item.href
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0066FF] dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <item.icon size={20} className={pathname === item.href ? 'text-[#0066FF] dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'} />
                    {item.name}
                </Link>
            ))}

            <div className="mt-8 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Administración
            </div>
            {systemItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${pathname === item.href
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0066FF] dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <item.icon size={20} className={pathname === item.href ? 'text-[#0066FF] dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'} />
                    {item.name}
                </Link>
            ))}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
            <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                <LucideLogOut size={20} />
                Cerrar sesión
            </button>
        </div>
    </aside>
))

Sidebar.displayName = 'Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const blockedRoutes = ['/dashboard/mail', '/dashboard/reports', '/dashboard/quotes']
        if (blockedRoutes.some(route => pathname?.startsWith(route))) {
            router.push('/dashboard')
        }
    }, [pathname, router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const menuItems = useMemo(() => MENU_ITEMS, [])
    const systemItems = useMemo(() => SYSTEM_ITEMS, [])

    const logoSrc = mounted && resolvedTheme === 'dark'
        ? "/logos/star-wide-w.png"
        : "/logos/star-wide-b.png"

    return (
        <UserProvider>
            <DataProvider>
                <AgentsProvider>
                    <ClientsProvider>
                        <AppointmentsProvider>
                            <DealsProvider>
                                <QuickActionsProvider>
                                    <div className="flex h-screen w-full bg-[#f5f6f8] dark:bg-slate-950 transition-colors duration-300">
                                        <Sidebar
                                            pathname={pathname}
                                            menuItems={menuItems}
                                            systemItems={systemItems}
                                            logoSrc={logoSrc}
                                            onLogout={handleLogout}
                                        />

                                        <main className="flex-1 flex flex-col h-screen overflow-hidden">
                                            <TopNav />
                                            <div className="flex-1 overflow-y-auto bg-[#f5f6f8] dark:bg-slate-950 p-4 md:p-6 pb-20 md:pb-6 transition-colors duration-300">
                                                {children}
                                            </div>
                                            <BottomNav />
                                        </main>
                                    </div>
                                    <Toaster />
                                </QuickActionsProvider>
                            </DealsProvider>
                        </AppointmentsProvider>
                    </ClientsProvider>
                </AgentsProvider>
            </DataProvider>
        </UserProvider>
    )
}