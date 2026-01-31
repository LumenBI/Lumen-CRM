import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LucideBriefcase, LucidePhone, LucideCalendarCheck, LucideDollarSign } from 'lucide-react'

async function fetchDashboardData(token: string) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/dashboard`
    console.log(`[Dashboard] Fetching data from: ${url}`)

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    })

    if (!res.ok) {
        const errorText = await res.text()
        console.error('NestJS Error:', res.status, errorText)
        throw new Error(`Error al conectar con NestJS: ${res.status} ${errorText}`)
    }

    try {
        return await res.json()
    } catch (error) {
        console.error('Error parsing JSON from:', url)
        // Clone response to read text body since .json() might have consumed stream partially or if we want to re-read? 
        // Actually .json() failed, so we can't read body again if it was consumed. 
        // But invalid json usually implies we can read text? 
        // Let's just catch and re-throw with context.
        // Or better, read text FIRST then parse JSON.
        throw new Error(`Invalid JSON response from ${url}`)
    }
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/')
    }

    const kpis = await fetchDashboardData(session.access_token)

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Panel Operativo</h1>
                    <p className="text-gray-600">Bienvenido, {session.user.email}</p>
                </div>
                <div className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

                <KpiCard
                    title="Contactos Totales"
                    value={kpis.total_contacts}
                    icon={<LucidePhone className="h-6 w-6 text-blue-600" />}
                />

                <KpiCard
                    title="Visitas Comerciales"
                    value={kpis.commercial_visits}
                    icon={<LucideBriefcase className="h-6 w-6 text-purple-600" />}
                />

                <KpiCard
                    title="Reuniones Virtuales"
                    value={kpis.virtual_meetings}
                    icon={<LucideCalendarCheck className="h-6 w-6 text-indigo-600" />}
                />

                <KpiCard
                    title="Ventas Cerradas"
                    value={`$${kpis.total_sales_usd || 0}`}
                    icon={<LucideDollarSign className="h-6 w-6 text-green-600" />}
                />
            </div>

            <div className="mt-10 rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-400">
                Aquí cargaremos el Kanban de Clientes...
            </div>
        </div>
    )
}

function KpiCard({ title, value, icon }: { title: string, value: string | number, icon: any }) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className="rounded-full bg-gray-50 p-3">{icon}</div>
            </div>
        </div>
    )
}