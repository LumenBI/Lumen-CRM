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
        { name: 'Flujo de Ventas', href: '/dashboard/kanban', icon: LucideKanban },
        { name: 'Agenda de Citas', href: '/dashboard/citas', icon: LucideCalendar },
        { name: 'Clientes', href: '#', icon: LucideUsers }, // Placeholder para futuro
    ]

    return (
        <div className="flex h-screen w-full bg-[#f5f6f8]">
            {/* SIDEBAR - Estilo Propuesta 1 */}
            <aside className="hidden w-64 flex-col border-r bg-white shadow-sm md:flex">
                <div className="flex h-16 items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-[#000d42]">
                        <LucideZap className="h-6 w-6 text-[#0056fc] fill-current" />
                        <span className="text-xl font-bold tracking-tight">Star CRM</span>
                    </div>
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
                                        ? 'bg-blue-50 text-[#0056fc]'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-[#0056fc]' : 'text-gray-400'} />
                                {item.name}
                            </Link>
                        )
                    })}

                    <div className="mt-8 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Sistema
                    </div>
                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                        <LucideSettings size={20} className="text-gray-400" />
                        Configuración
                    </button>
                </div>

                <div className="border-t p-4">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                        <LucideLogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto">
                {/* Header Móvil (visible solo en pantallas pequeñas) */}
                <div className="flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
                    <span className="font-bold text-[#000d42]">Star CRM</span>
                    <button className="rounded p-2 text-gray-500 hover:bg-gray-100">
                        <span className="sr-only">Menu</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Contenido Dinámico */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
