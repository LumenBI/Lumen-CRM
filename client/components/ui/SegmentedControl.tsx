'use client'

import { motion } from 'framer-motion'

interface Option {
    label: string
    value: string
    icon?: React.ElementType
}

interface SegmentedControlProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
}

export default function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
    return (
        <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg relative">
            {options.map((option) => {
                const isActive = value === option.value
                const Icon = option.icon

                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`relative flex-1 py-1.5 px-3 text-sm font-medium transition-colors z-10 flex items-center justify-center gap-2 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="segmented-bg"
                                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-gray-200/50 dark:border-slate-600"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                style={{ zIndex: -1 }}
                            />
                        )}
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{option.label}</span>
                    </button>
                )
            })}
        </div>
    )
}