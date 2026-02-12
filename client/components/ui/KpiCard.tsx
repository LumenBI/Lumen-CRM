import { ReactNode } from 'react'

interface KpiCardProps {
    title: string
    value: string | number
    change?: string
    trend?: string
    icon: ReactNode
    color: string
}

export default function KpiCard({ title, value, change, trend, icon, color }: KpiCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity`}></div>

            <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-14 h-14 ${color} rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>

                <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

                <div className="flex items-baseline gap-3 mb-2">
                    <p className="text-4xl font-bold text-[#000D42]">{value}</p>
                    {change && trend && (
                        <span className={`text-sm font-semibold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {change}
                        </span>
                    )}
                </div>

                {trend && (
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
                )}
            </div>

            <div className={`absolute bottom-0 left-0 right-0 h-1 ${color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        </div>
    )
}
