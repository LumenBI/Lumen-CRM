import { LucideMessageSquare, LucidePhone, LucideCalendar, LucideUser } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { TEXTS } from '@/constants/text'

interface RecentActivityWidgetProps {
    activities: any[] | null
}

export default function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
    const getIcon = (category: string) => {
        switch (category?.toUpperCase()) {
            case 'CALL': return <LucidePhone size={14} className="text-blue-500" />
            case 'MEETING': return <LucideCalendar size={14} className="text-purple-500" />
            case 'EMAIL': return <LucideMessageSquare size={14} className="text-emerald-500" />
            default: return <LucideUser size={14} className="text-slate-500" />
        }
    }

    if (!activities) {
        return (
            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm h-full">
                <h3 className="mb-4 font-bold text-[#000D42] dark:text-white">{TEXTS.RECENT_ACTIVITY}</h3>
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const activitiesToShow = activities.slice(0, 5);

    return (
        <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm h-full">
            <h3 className="mb-4 font-bold text-[#000D42] dark:text-white">{TEXTS.RECENT_ACTIVITY}</h3>
            {activitiesToShow.length === 0 ? (
                <div className="flex items-center justify-center h-32 border border-dashed border-gray-100 dark:border-slate-800 rounded-lg bg-gray-50/50 dark:bg-slate-800/20">
                    <p className="text-sm text-gray-400 dark:text-slate-500">Sin actividad reciente</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activitiesToShow.map((activity: any, idx) => (
                        <div key={activity.id || idx} className="flex gap-3 items-start group">
                            <div className="mt-1 p-2 rounded-full border border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-sm transition-all">
                                {getIcon(activity.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#000D42] dark:text-slate-200 truncate">
                                    {activity.client?.company_name || 'Cliente'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{activity.summary}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: es }) : 'Recientemente'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

