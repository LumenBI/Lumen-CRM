import { Search } from 'lucide-react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Buscar...', className = '' }: SearchBarProps) {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 border border-transparent dark:border-slate-800 ${className}`}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:border-[#0066FF] dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all text-lg text-gray-900 dark:text-white"
                />
            </div>
        </div>
    )
}
