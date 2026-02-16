'use client'

import React from 'react'
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
    size?: 'sm' | 'md'
    className?: string
}

export default function SegmentedControl({
    options,
    value,
    onChange,
    size = 'md',
    className = ''
}: SegmentedControlProps) {
    return (
        <div className={`inline-flex p-1 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-hide max-w-full ${className}`}>
            <div className="flex items-center">
                {options.map((option) => {
                    const isActive = value === option.value
                    return (
                        <button
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={`relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 z-10 whitespace-nowrap
                                ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}
                                ${size === 'sm' ? 'px-3 py-1' : 'px-4 py-1.5'}
                            `}
                        >
                            {option.icon && <option.icon size={16} />}
                            <span>{option.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="segmented-active"
                                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100/50 dark:border-slate-700/50 -z-10"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
