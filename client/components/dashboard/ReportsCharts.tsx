'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts'
import { LucidePieChart } from 'lucide-react'
import { useTheme } from 'next-themes'

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

interface ReportsChartsProps {
    historyData: AggregatedData[]
    pipelineData: PipelineData[]
}

export default function ReportsCharts({ historyData, pipelineData }: ReportsChartsProps) {
    const { resolvedTheme } = useTheme();
    if (!historyData || !pipelineData) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CHART 1: History Trend */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-white mb-4">Tendencia de Actividad</h2>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-slate-800" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
                                    color: resolvedTheme === 'dark' ? '#f1f5f9' : '#1e293b'
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="interactions" name="Interacciones" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="appointments" name="Citas" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="sales" name="Seguimientos" stroke="#22c55e" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CHART 2: Sales Funnel */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
                    <LucidePieChart size={20} className="text-blue-500" />
                    Embudo de Seguimientos (Actual)
                </h2>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pipelineData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-gray-100 dark:text-slate-800" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
                                    color: resolvedTheme === 'dark' ? '#f1f5f9' : '#1e293b'
                                }}
                            />
                            <Bar dataKey="count" name="Oportunidades" radius={[0, 4, 4, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
