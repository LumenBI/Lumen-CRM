import { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle: string
    actionLabel?: string
    actionIcon?: ReactNode
    onAction?: () => void
    children?: ReactNode
}

/**
 * Reusable gradient page header used across clients, kanban, and users pages.
 * Supports an optional action button and a children slot (e.g., for filter buttons).
 */
export default function PageHeader({ title, subtitle, actionLabel, actionIcon, onAction, children }: PageHeaderProps) {
    return (
        <div className="bg-gradient-to-r from-[#000D42] to-[#0066FF] rounded-2xl p-8 shadow-xl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
                    <p className="text-blue-100 text-lg">{subtitle}</p>
                </div>
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="flex items-center gap-2 bg-white text-[#0066FF] px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        {actionIcon}
                        {actionLabel}
                    </button>
                )}
            </div>
            {children}
        </div>
    )
}
