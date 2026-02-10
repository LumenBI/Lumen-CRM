import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget'
import KpiCard from '@/components/ui/KpiCard'
import { LucidePhone, LucideCalendarCheck, LucideDollarSign, LucideUserPlus } from 'lucide-react'

async function fetchDashboardData(token: string) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    })

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            console.error('Unauthorized detected, redirecting to login');
            redirect('/?error=account_disabled')
        }
        console.error(`Dashboard fetch error: ${res.status} ${res.statusText}`);
        throw new Error(`Error al conectar con NestJS: ${res.status} ${res.statusText}`)
    }
    return res.json()
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/')
    }

    let kpis;
    try {
        kpis = await fetchDashboardData(session.access_token)
    } catch (error) {
        console.error("Failed to load dashboard data:", error)
        throw error;
    }

    return (
        <div className="space-y-8 p-8">
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-[#000D42] mb-2">Panel de Control</h1>
                <p className="text-lg text-gray-500">Bienvenido de nuevo, aquí está lo que sucede hoy.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Nuevos Prospectos"
                    value={kpis.new_prospects}
                    change={kpis.new_prospects_change}
                    trend={kpis.new_prospects_trend}
                    icon={<LucideUserPlus className="h-6 w-6 text-white" />}
                    color="bg-[#0066FF]"
                />

                <KpiCard
                    title="Interacciones"
                    value={kpis.total_interactions}
                    change={kpis.total_interactions_change}
                    trend={kpis.total_interactions_trend}
                    icon={<LucidePhone className="h-6 w-6 text-white" />}
                    color="bg-gradient-to-br from-purple-500 to-purple-700"
                />

                <KpiCard
                    title="Visitas Comerciales"
                    value={kpis.appointments_count}
                    change={kpis.appointments_count_change}
                    trend={kpis.appointments_count_trend}
                    icon={<LucideCalendarCheck className="h-6 w-6 text-white" />}
                    color="bg-gradient-to-br from-orange-400 to-orange-600"
                />

                <KpiCard
                    title="Ventas Cerradas"
                    value={kpis.won_count}
                    change={kpis.won_count_change}
                    trend={kpis.won_count_trend}
                    icon={<LucideDollarSign className="h-6 w-6 text-white" />}
                    color="bg-gradient-to-br from-emerald-400 to-emerald-600"
                />
            </div>

            {/* Sección de Información Adicional */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-bold text-[#000d42]">Actividad Reciente</h3>
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed bg-gray-50 text-gray-400">
                        Gráfico de rendimiento (Próximamente)
                    </div>
                </div>

                <UpcomingAppointmentsWidget />
            </div>
        </div>
    )
}