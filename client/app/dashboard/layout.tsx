'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LucideLayoutDashboard,
    LucideKanban,
    LucideCalendar,
    LucideUsers,
    LucideSettings,
    LucideLogOut,
    LucideZap
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/notifications/NotificationBell'

import { UserProvider } from '@/context/UserContext'
import { ClientsProvider } from '@/context/ClientsContext'
import { AgentsProvider } from '@/context/AgentsContext'
import { AppointmentsProvider } from '@/context/AppointmentsContext'
import { DealsProvider } from '@/context/DealsContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const menuItems = [
        { name: 'Resumen', href: '/dashboard', icon: LucideLayoutDashboard },
        { name: 'Ventas', href: '/dashboard/kanban', icon: LucideKanban },
        { name: 'Agenda', href: '/dashboard/citas', icon: LucideCalendar },
        { name: 'Clientes', href: '/dashboard/clients', icon: LucideUsers },
    ]

    const systemItems = [
        { name: 'Usuarios', href: '/dashboard/users', icon: LucideSettings },
    ]

    return (
        <UserProvider>
            <ClientsProvider>
                <AgentsProvider>
                    <AppointmentsProvider>
                        <DealsProvider>
                            <div className="flex h-screen w-full bg-[#f5f6f8]">
                                {/* ... existing layout content ... */}
                                <aside className="hidden w-64 flex-col border-r bg-white shadow-sm md:flex">
                                    {/* ... sidebar ... */}
                                    <div className="flex h-16 items-center px-6 border-b border-gray-100">
                                        <Link href="/dashboard" className="flex items-center gap-3">
                                            <img
                                                src="/logos/uploaded_media_1_1769879788623.png"
                                                alt="Star CRM"
                                                className="h-8 w-auto object-contain"
                                            />
                                        </Link>
                                    </div>

                                    <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                                        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            Principal
                                        </div>

                                        {menuItems.map((item) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                                        ${isActive
                                                            ? 'bg-blue-50 text-[#0066FF] shadow-sm'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <item.icon size={20} className={isActive ? 'text-[#0066FF]' : 'text-gray-400'} />
                                                    {item.name}
                                                </Link>
                                            )
                                        })}

                                        <div className="mt-8 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            Administración
                                        </div>
                                        {systemItems.map((item) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                                        ${isActive
                                                            ? 'bg-blue-50 text-[#0066FF] shadow-sm'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <item.icon size={20} className={isActive ? 'text-[#0066FF]' : 'text-gray-400'} />
                                                    {item.name}
                                                </Link>
                                            )
                                        })}
                                    </div>

                                    <div className="border-t p-4">
                                        <button
                                            onClick={handleLogout}
                                            className="mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-[#000D42] hover:bg-[#001966] transition-all"
                                        >
                                            <LucideLogOut size={20} />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </aside>

                                <main className="flex-1 overflow-y-auto relative">
                                    <div className="hidden md:flex w-full justify-end items-center px-8 pt-4 pb-2 bg-transparent z-40">
                                        <div className="flex items-center gap-4">
                                            <NotificationBell />
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0066FF] to-[#000D42] text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer hover:scale-110 transition-transform">
                                                A
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
                                        <img
                                            src="/logos/uploaded_media_1_1769879788623.png"
                                            alt="Star CRM"
                                            className="h-6 w-auto object-contain"
                                        />
                                        <div className="flex items-center gap-3">
                                            <NotificationBell />
                                            <button className="rounded p-2 text-gray-500 hover:bg-gray-100">
                                                <span className="sr-only">Menu</span>
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        {children}
                                    </div>
                                </main>
                            </div>
                        </DealsProvider>
                    </AppointmentsProvider>
                </AgentsProvider>
            </ClientsProvider>
        </UserProvider>
    )
}
