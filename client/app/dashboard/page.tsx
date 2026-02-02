import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget'
import { LucideBriefcase, LucidePhone, LucideCalendarCheck, LucideDollarSign, LucideUserPlus, LucideKanban } from 'lucide-react'

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
            // We can throw valid redirection from here in Server Components
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
        // Only redirect if it's strictly clearly an auth issue we missed or generic fallback?
        // Actually fetchDashboardData handles the redirect for 401. 
        // For other errors, we might render an error state or let it bubble.
        // Let's safe guard Kpis to avoid render crash if error was swallowed.
        // But throwing above is better.
        throw error;
    }

    return (
        <div className="space-y-8 p-8">
            {/* Header de la Página */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-[#000D42] mb-2">Panel de Control</h1>
                <p className="text-lg text-gray-500">Bienvenido de nuevo, aquí está lo que sucede hoy.</p>
            </div>

            {/* Grid de KPIs - Estilo Propuesta 1 */}
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

// KpiCard Component - REDESIGNED con estética premium
function KpiCard({ title, value, change, trend, icon, color }: {
    title: string
    value: string | number
    change: string
    trend: string
    icon: React.ReactNode
    color: string
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            {/* Gradient Background Effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity`}></div>

            <div className="relative z-10">
                {/* Icon Container with Gradient */}
                <div className={`inline-flex items-center justify-center w-14 h-14 ${color} rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

                {/* Value - MUCHO MÁS GRANDE */}
                <div className="flex items-baseline gap-3 mb-2">
                    <p className="text-4xl font-bold text-[#000D42]">{value}</p>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {change}
                    </span>
                </div>

                {/* Trend Indicator */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    {trend === 'up' ? (
                        <>
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>vs. mes anterior</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                            <span>vs. mes anterior</span>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        </div>
    )
}