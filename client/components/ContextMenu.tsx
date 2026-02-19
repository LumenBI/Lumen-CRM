'use client'

import { useEffect, useRef, useState } from 'react'
import { LucideChevronRight } from 'lucide-react'

export type ContextMenuItem = {
    label: string
    icon?: React.ComponentType<{ size?: number | string; className?: string }>
    action?: () => void
    subItems?: ContextMenuItem[]
    className?: string
    disabled?: boolean
}

interface ContextMenuProps {
    x: number
    y: number
    title?: string
    onClose: () => void
    items: ContextMenuItem[]
}

export default function ContextMenu({ x, y, title, onClose, items }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({ top: y, left: x })

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        // Calculate position after render
        if (menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            let newTop = y
            let newLeft = x

            // Vertical positioning: flip upwards if not enough space below
            if (y + menuRect.height > viewportHeight) {
                newTop = y - menuRect.height
                // Ensure it doesn't go off the top of the screen
                if (newTop < 0) {
                    newTop = 0
                }
            }

            // Horizontal positioning: clamp to the right edge if not enough space
            if (x + menuRect.width > viewportWidth) {
                newLeft = viewportWidth - menuRect.width - 10 // 10px padding from right edge
                // Ensure it doesn't go off the left of the screen
                if (newLeft < 0) {
                    newLeft = 0
                }
            }

            setPosition({ top: newTop, left: newLeft })
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [x, y, onClose])

    const style = {
        top: position.top,
        left: position.left,
    }

    return (
        <div
            ref={menuRef}
            style={style}
            className="fixed z-[10000] w-64 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-800 py-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
        >
            {title && (
                <div className="px-4 py-2 border-b border-gray-50 dark:border-slate-800 mb-1">
                    <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider truncate">
                        {title}
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-0.5 p-1">
                {items.map((item, index) => (
                    <ContextItem
                        key={index}
                        item={item}
                        onClose={onClose}
                    />
                ))}
            </div>
        </div>
    )
}

function ContextItem({ item, onClose }: { item: ContextMenuItem, onClose: () => void }) {
    const [showSub, setShowSub] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setShowSub(true)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowSub(false)
        }, 300)
    }

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                onClick={() => {
                    if (!item.disabled && item.action) {
                        item.action()
                        onClose()
                    }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left
                    ${item.disabled
                        ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-slate-600'
                        : item.className
                            ? item.className
                            : 'text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
            >
                <div className="flex items-center gap-3">
                    {item.icon && <item.icon size={16} />}
                    {item.label}
                </div>
                {item.subItems && <LucideChevronRight size={14} className="text-gray-400" />}
            </button>

            {item.subItems && showSub && (
                <div className="absolute left-full top-0 ml-1 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-800 py-2 animate-in fade-in slide-in-from-left-1 duration-100 flex flex-col p-1">
                    {item.subItems.map((sub, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (!sub.disabled && sub.action) {
                                    sub.action()
                                    onClose()
                                }
                            }}
                            disabled={sub.disabled}
                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left
                                ${sub.disabled
                                    ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-slate-600'
                                    : 'text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                        >
                            {sub.icon && <sub.icon size={16} />}
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
