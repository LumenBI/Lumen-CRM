import { ReactNode, ElementType } from 'react'

interface PageHeaderProps {
    title: string
    subtitle: string
    icon?: ElementType
    actionLabel?: string
    actionIcon?: ReactNode
    onAction?: () => void
    actionClassName?: string
    extraActions?: ReactNode
    children?: ReactNode
}

export default function PageHeader({
    title,
    subtitle,
    icon: Icon,
    actionLabel,
    actionIcon,
    onAction,
    actionClassName,
    extraActions,
    children
}: PageHeaderProps) {
    return (
        <div className="mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center min-h-[64px] gap-4 px-2">
                {/* Left Side: Icon + Title + Subtitle */}
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50 dark:border-blue-800/30">
                            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                            {title}
                        </h1>
                        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
                    </div>
                </div>

                {/* Right Side: Filters + Action Button */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {extraActions && (
                        <div className="flex items-center gap-2">
                            {extraActions}
                        </div>
                    )}

                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className={`group h-11 flex items-center gap-2 px-6 rounded-xl font-bold transition-all duration-300 border-2 active:scale-95 shadow-sm text-sm
                                ${actionClassName || 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white'}`}
                        >
                            {actionIcon && <span className="transition-transform group-hover:scale-110">{actionIcon}</span>}
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
            {children && <div className="mt-6">{children}</div>}
        </div>
    )
}
