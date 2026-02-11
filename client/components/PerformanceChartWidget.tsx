'use client'

import { useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { TEXTS } from '@/constants/text'
import { useData } from '@/context/DataContext'

export default function PerformanceChartWidget() {
    const { history, loading } = useData()

    const data = useMemo(() => {
        if (!history || history.length === 0) return []

        return history
            .slice(0, 7)
            .map((day: any) => ({
                name: new Date(day.report_date).toLocaleDateString('es-ES', { weekday: 'short' }),
                value: day.total_interactions_count || 0
            }))
            .reverse()
    }, [history])

    if (loading) return (
        <div className="h-[250px] w-full flex items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-gray-200">
            <span className="text-sm text-slate-400">Cargando gráfico...</span>
        </div>
    )

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-[#000D42] text-lg">{TEXTS.PERFORMANCE_CHART}</h3>
                    <p className="text-sm text-slate-500">Tendencia de seguimientos semanales</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +12% vs racha anterior
                    </span>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0056fc" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#0056fc" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                padding: '8px 12px'
                            }}
                            labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                            itemStyle={{ color: '#000D42', fontWeight: 'bold', fontSize: '14px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#0056fc"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
