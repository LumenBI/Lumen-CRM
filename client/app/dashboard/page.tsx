import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget'
import { LucideBriefcase, LucidePhone, LucideCalendarCheck, LucideDollarSign, LucideUserPlus, LucideKanban } from 'lucide-react'

async function fetchDashboardData(token: string) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/dashboard`

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    })

    if (!res.ok) throw new Error('Error al conectar con NestJS')
    return res.json()
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/')
    }

    const kpis = await fetchDashboardData(session.access_token)

    return (
        <div className="space-y-8">
            {/* Header de la Página */}
            <div>
                <h1 className="text-2xl font-bold text-[#000d42]">Panel de Control</h1>
                <p className="text-gray-500">Bienvenido de nuevo, aquí está lo que sucede hoy.</p>
            </div>

            {/* Grid de KPIs - Estilo Propuesta 1 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Nuevos Prospectos"
                    value={kpis.new_prospects}
                    change="+4.5%" // Puedes calcular esto real luego
                    trend="up"
                    icon={<LucideUserPlus className="h-6 w-6 text-white" />}
                    color="bg-[#0056fc]" // Azul Propuesta 1
                />

                <KpiCard
                    title="Interacciones"
                    value={kpis.total_interactions}
                    change="+12%"
                    trend="up"
                    icon={<LucidePhone className="h-6 w-6 text-white" />}
                    color="bg-purple-600"
                />

                <KpiCard
                    title="Visitas Comerciales"
                    value={kpis.commercial_visits}
                    change="0%"
                    trend="neutral"
                    icon={<LucideBriefcase className="h-6 w-6 text-white" />}
                    color="bg-orange-500"
                />

                <KpiCard
                    title="Ventas Cerradas"
                    value={`$${kpis.total_sales_usd || 0}`}
                    change="+28%"
                    trend="up"
                    icon={<LucideDollarSign className="h-6 w-6 text-white" />}
                    color="bg-emerald-500"
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

// Componente de Tarjeta Rediseñado
function KpiCard({ title, value, icon, color, change, trend }: any) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold text-[#000d42]">{value}</h3>
                </div>
                <div className={`rounded-xl p-3 shadow-sm ${color}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
                <span className={`font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {change}
                </span>
                <span className="text-gray-400">desde ayer</span>
            </div>
        </div>
    )
}