import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UpcomingAppointmentsWidget from '@/components/appointments/UpcomingAppointmentsWidget'
import { TEXTS } from '@/constants/text'
import RecentActivityWidget from '@/components/RecentActivityWidget'
import PerformanceChartWidget from '@/components/PerformanceChartWidget'
import DashboardMetrics from '@/components/dashboard/DashboardMetrics'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
        redirect('/')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold text-[#000D42] mb-2">{TEXTS.DASHBOARD_TITLE}</h1>
                <p className="text-lg text-gray-500">{TEXTS.WELCOME_BACK}</p>
            </div>

            <DashboardMetrics />

            <div className="grid gap-6 lg:grid-cols-2">
                <div id="recent-activity-container">
                    <RecentActivityWidget />
                </div>

                <div id="upcoming-appointments-container">
                    <UpcomingAppointmentsWidget />
                </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <PerformanceChartWidget />
            </div>
        </div>
    )
}
