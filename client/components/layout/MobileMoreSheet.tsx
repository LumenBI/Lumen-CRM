'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LucideX } from 'lucide-react'
import type { MenuItem } from '@/constants/text'
import { MENU_ITEMS, SYSTEM_ITEMS } from '@/constants/text'

const MORE_ITEMS: MenuItem[] = [
    MENU_ITEMS[4], // Buzón
    MENU_ITEMS[5], // Reportes
    MENU_ITEMS[6], // Cotizaciones
]
const ADMIN_ITEMS = SYSTEM_ITEMS

interface MobileMoreSheetProps {
    isOpen: boolean
    onClose: () => void
    pathname: string
}

export default function MobileMoreSheet({ isOpen, onClose, pathname }: MobileMoreSheetProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(href)
    }

    const renderItem = (item: MenuItem) => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
            <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-4 py-3.5 text-sm font-medium transition-all ${
                    active
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0066FF] dark:text-blue-400'
                        : 'text-gray-600 dark:text-slate-400 active:bg-gray-50 dark:active:bg-slate-800'
                }`}
            >
                <Icon size={22} className={active ? 'text-[#0066FF] dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'} />
                {item.name}
            </Link>
        )
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <motion.div
                        key="sheet"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[9999] rounded-t-2xl bg-white dark:bg-slate-900 shadow-2xl border-t border-gray-100 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] max-h-[70vh] overflow-hidden flex flex-col"
                    >
                        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Más opciones
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-400"
                                aria-label="Cerrar"
                            >
                                <LucideX size={22} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                            {MORE_ITEMS.map(renderItem)}
                            <div className="mt-6 px-4 py-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                                    Administración
                                </p>
                            </div>
                            {ADMIN_ITEMS.map(renderItem)}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
