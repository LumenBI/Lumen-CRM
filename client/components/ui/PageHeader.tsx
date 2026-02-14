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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="px-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        {Icon && <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                        {title}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{subtitle}</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto px-2">
                    {extraActions && (
                        <div className="flex items-center gap-2">
                            {extraActions}
                        </div>
                    )}
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className={`flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] ${actionClassName || 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-blue-200 dark:shadow-none'}`}
                        >
                            {actionIcon}
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
            {children && <div className="mt-6">{children}</div>}
        </div>
    )
}
