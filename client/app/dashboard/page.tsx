import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UpcomingAppointmentsWidget from '@/components/appointments/UpcomingAppointmentsWidget'
import { TEXTS } from '@/constants/text'
import RecentActivityWidget from '@/components/RecentActivityWidget'
import PerformanceChartWidget from '@/components/PerformanceChartWidget'
import DashboardMetrics from '@/components/dashboard/DashboardMetrics'

import PageHeader from '@/components/ui/PageHeader'
import { LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
        redirect('/')
    }

    return (
        <div className="space-y-6 p-4 md:p-8">
            <PageHeader
                title={TEXTS.DASHBOARD_TITLE}
                subtitle={TEXTS.WELCOME_BACK}
                icon={LayoutDashboard}
            />

            <DashboardMetrics />

            <div className="grid gap-6 lg:grid-cols-2">
                <div id="recent-activity-container">
                    <RecentActivityWidget />
                </div>

                <div id="upcoming-appointments-container">
                    <UpcomingAppointmentsWidget />
                </div>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <PerformanceChartWidget />
            </div>
        </div>
    )
}
