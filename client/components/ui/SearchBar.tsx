import { Search } from 'lucide-react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

/**
 * Reusable search input with icon, replacing duplicated search bars
 * across clients and users pages.
 */
export default function SearchBar({ value, onChange, placeholder = 'Buscar...', className = '' }: SearchBarProps) {
    return (
        <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-[#0066FF] focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg"
                />
            </div>
        </div>
    )
}
