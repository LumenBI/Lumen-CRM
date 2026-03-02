import KpiCard from '@/components/ui/KpiCard'
import { LucidePhone, LucideCalendarCheck, LucideDollarSign, LucideUserPlus } from 'lucide-react'
import { TEXTS } from '@/constants/text'

interface DashboardMetricsProps {
    stats: {
        new_prospects: number
        new_prospects_change: string
        new_prospects_trend: string
        total_interactions: number
        total_interactions_change: string
        total_interactions_trend: string
        appointments_count: number
        appointments_count_change: string
        appointments_count_trend: string
        won_count: number
        won_count_change: string
        won_count_trend: string
    } | null
}

export default function DashboardMetrics({ stats }: DashboardMetricsProps) {
    if (!stats) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
                title={TEXTS.NEW_PROSPECTS}
                value={stats.new_prospects}
                change={stats.new_prospects_change}
                trend={stats.new_prospects_trend}
                icon={<LucideUserPlus className="h-6 w-6 text-white" />}
                color="bg-blue-500"
            />
            <KpiCard
                title={TEXTS.INTERACTIONS}
                value={stats.total_interactions}
                change={stats.total_interactions_change}
                trend={stats.total_interactions_trend}
                icon={<LucidePhone className="h-6 w-6 text-white" />}
                color="bg-purple-500"
            />
            <KpiCard
                title={TEXTS.COMMERCIAL_VISITS}
                value={stats.appointments_count}
                change={stats.appointments_count_change}
                trend={stats.appointments_count_trend}
                icon={<LucideCalendarCheck className="h-6 w-6 text-white" />}
                color="bg-orange-500"
            />
            <KpiCard
                title={TEXTS.CLOSED_SALES}
                value={stats.won_count}
                change={stats.won_count_change}
                trend={stats.won_count_trend}
                icon={<LucideDollarSign className="h-6 w-6 text-white" />}
                color="bg-emerald-500"
            />
        </div>
    )
}

