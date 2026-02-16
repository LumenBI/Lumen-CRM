'use client'

import { useState, useEffect } from 'react'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import dynamic from 'next/dynamic'
const ReportsCharts = dynamic(() => import('@/components/dashboard/ReportsCharts'), {
    ssr: false,
    loading: () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 animate-pulse h-[380px]" />
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 animate-pulse h-[380px]" />
    </div>
})
import { BarChart3 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { STAGES } from '@/constants/stages'

interface HistoryRecord {
    report_date: string
    total_contacts: number
    commercial_visits: number
    deals_won: number
}

interface AggregatedData {
    name: string
    interactions: number
    appointments: number
    sales: number
}

interface PipelineData {
    name: string
    count: number
    fill: string
}

export default function ReportsPage() {
    const [historyData, setHistoryData] = useState<AggregatedData[]>([])
    const [pipelineData, setPipelineData] = useState<PipelineData[]>([])
    const [loading, setLoading] = useState(true)
    const { authFetch } = useAuthFetch()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch History for Time Series
                const historyRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/stats/history`)
                const historyJson: HistoryRecord[] = await historyRes.json()

                // Process History: Aggregate by Month
                const aggregated = historyJson.reduce((acc: Record<string, AggregatedData>, curr) => {
                    const month = curr.report_date.substring(0, 7) // YYYY-MM
                    if (!acc[month]) {
                        acc[month] = { name: month, interactions: 0, appointments: 0, sales: 0 }
                    }
                    acc[month].interactions += (curr.total_contacts || 0)
                    acc[month].appointments += (curr.commercial_visits || 0)
                    acc[month].sales += (curr.deals_won || 0)
                    return acc
                }, {})

                const historyChartData = Object.values(aggregated).sort((a, b) => a.name.localeCompare(b.name))

                // 2. Fetch Kanban for Pipeline Snapshot — built from centralized STAGES
                const kanbanRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/stats/kanban`)
                const kanbanJson = await kanbanRes.json()

                const visibleStages = STAGES.filter(s => s.id !== 'PENDING' && s.id !== 'CERRADO_PERDIDO')
                const pipelineChartData: PipelineData[] = visibleStages.map(stage => ({
                    name: stage.title,
                    count: kanbanJson[stage.id]?.length || 0,
                    fill: stage.chartColor,
                }))

                setHistoryData(historyChartData)
                setPipelineData(pipelineChartData)
            } catch (error) {
                console.error("Error loading reports:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [authFetch])

    if (loading) {
        return (
            <div className="space-y-6 p-4 md:p-8">
                <PageHeader title="Reportes y Analíticas" subtitle="Visualiza el rendimiento de tu equipo comercial" icon={BarChart3} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 animate-pulse h-[380px]" />
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 animate-pulse h-[380px]" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-4 md:p-8">
            <PageHeader title="Reportes y Analíticas" subtitle="Visualiza el rendimiento de tu equipo comercial" icon={BarChart3} />

            <ReportsCharts historyData={historyData} pipelineData={pipelineData} />

            {/* KPIs Summary Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800">
                    <h3 className="font-semibold text-gray-700 dark:text-slate-200">Resumen Mensual</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-3">Mes</th>
                                <th className="px-6 py-3 text-center">Interacciones</th>
                                <th className="px-6 py-3 text-center">Citas</th>
                                <th className="px-6 py-3 text-center">Seguimientos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {historyData.slice().reverse().map((row: AggregatedData, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">{row.name}</td>
                                    <td className="px-6 py-3 text-center text-gray-600 dark:text-slate-400">{row.interactions}</td>
                                    <td className="px-6 py-3 text-center text-gray-600 dark:text-slate-400">{row.appointments}</td>
                                    <td className="px-6 py-3 text-center font-semibold text-green-600 dark:text-green-400">{row.sales}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
