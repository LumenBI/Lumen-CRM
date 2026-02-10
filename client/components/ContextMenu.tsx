'use client'

import { useEffect, useRef } from 'react'

export type ContextMenuItem = {
    label: string
    icon?: React.ComponentType<{ size?: number | string; className?: string }>
    action: () => void
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    // Basic positioning logic to prevent overflow would go here
    // For now, simple absolute positioning
    const style = {
        top: y,
        left: x,
    }

    return (
        <div
            ref={menuRef}
            style={style}
            className="fixed z-[10000] w-64 rounded-xl bg-white shadow-2xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
        >
            {title && (
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
                        {title}
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-0.5 p-1">
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (!item.disabled) {
                                item.action()
                                onClose()
                            }
                        }}
                        disabled={item.disabled}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left
                            ${item.disabled
                                ? 'opacity-50 cursor-not-allowed text-gray-400'
                                : item.className
                                    ? item.className
                                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                    >
                        {item.icon && <item.icon size={16} />}
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
