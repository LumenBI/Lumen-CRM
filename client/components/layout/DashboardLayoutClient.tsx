'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import { MENU_ITEMS, SYSTEM_ITEMS } from '@/constants/text'
import { DashboardProviders } from '@/components/providers/DashboardProviders'
import { useTheme } from 'next-themes'
import { createClient } from '@/utils/supabase/client'

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
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
        <DashboardProviders>
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
        </DashboardProviders>
    )
}
