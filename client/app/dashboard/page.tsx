import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UpcomingAppointmentsWidget from '@/components/appointments/UpcomingAppointmentsWidget'
import { TEXTS } from '@/constants/text'
import RecentActivityWidget from '@/components/RecentActivityWidget'
import PerformanceChartWidget from '@/components/PerformanceChartWidget'
import DashboardMetrics from '@/components/dashboard/DashboardMetrics'
import { getDashboardStats } from '@/utils/stats-server'

import PageHeader from '@/components/ui/PageHeader'
import { LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
        redirect('/')
    }

    const userId = session.user.id

    // Fetch everything on the server
    const [stats, { data: activities }, { data: appointments }] = await Promise.all([
        getDashboardStats(supabase, userId),
        supabase.from('interactions').select('*, client:clients(company_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('appointments').select('*, client:clients(company_name, contact_name)').eq('agent_id', userId).gte('appointment_date', new Date().toISOString().split('T')[0]).order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true }).limit(3)
    ])

    return (
        <div className="space-y-6 p-4 md:p-8">
            <PageHeader
                title={TEXTS.DASHBOARD_TITLE}
                subtitle={TEXTS.WELCOME_BACK}
                icon={LayoutDashboard}
            />

            <DashboardMetrics stats={stats} />

            <div className="grid gap-6 lg:grid-cols-2">
                <div id="recent-activity-container">
                    <RecentActivityWidget activities={activities} />
                </div>

                <div id="upcoming-appointments-container">
                    <UpcomingAppointmentsWidget appointments={appointments} />
                </div>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <PerformanceChartWidget />
            </div>
        </div>
    )
}

