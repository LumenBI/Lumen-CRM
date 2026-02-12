'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LucideLogOut,
    LucideZap,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/notifications/NotificationBell'
import { Toaster } from '@/components/ui/sonner'
import TopNav from '@/components/layout/TopNav'
import { MENU_ITEMS, SYSTEM_ITEMS } from '@/constants/text'

import { UserProvider } from '@/context/UserContext'
import { DataProvider } from '@/context/DataContext'
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

    const menuItems = MENU_ITEMS
    const systemItems = SYSTEM_ITEMS


    return (
        <UserProvider>
            <DataProvider>
                <ClientsProvider>
                    <AgentsProvider>
                        <AppointmentsProvider>
                            <DealsProvider>
                                <div className="flex h-screen w-full bg-[#f5f6f8]">
                                    <aside className="hidden w-64 flex-col border-r bg-white shadow-sm md:flex">
                                        <div className="flex h-16 items-center px-6 border-b border-gray-100">
                                            <Link href="/dashboard" className="flex items-center gap-3">
                                                <img src="/logos/star-wide-b.png" alt="Star CRM" className="h-8 object-contain" />
                                            </Link>
                                        </div>

                                        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                                            {menuItems.map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${pathname === item.href
                                                        ? 'bg-blue-50 text-[#0066FF] shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <item.icon size={20} className={pathname === item.href ? 'text-[#0066FF]' : 'text-gray-400'} />
                                                    {item.name}
                                                </Link>
                                            ))}

                                            <div className="mt-8 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                Administración
                                            </div>
                                            {systemItems.map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${pathname === item.href
                                                        ? 'bg-blue-50 text-[#0066FF] shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <item.icon size={20} className={pathname === item.href ? 'text-[#0066FF]' : 'text-gray-400'} />
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="p-4 border-t border-gray-100">
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LucideLogOut size={20} />
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    </aside>

                                    <main className="flex-1 flex flex-col h-screen overflow-hidden">
                                        <TopNav />
                                        <div className="flex-1 overflow-y-auto bg-[#f5f6f8] p-6">
                                            {children}
                                        </div>
                                    </main>
                                </div>
                                <Toaster />
                            </DealsProvider>
                        </AppointmentsProvider>
                    </AgentsProvider>
                </ClientsProvider>
            </DataProvider>
        </UserProvider>
    )
}
