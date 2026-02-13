import React from 'react';
import { cn } from "@/lib/utils"; // Assuming utils exists, if not I will fix

interface CurrencySelectorProps {
    value: string;
    onChange: (value: string) => void;
    exchangeRate?: number;
    className?: string; // Add className prop
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange, exchangeRate, className }) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0066FF] disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-white transition-colors"
            >
                <option value="USD">USD</option>
                <option value="CRC">CRC</option>
            </select>
            {value === 'CRC' && exchangeRate && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Rate: ₡{exchangeRate}
                </span>
            )}
        </div>
    );
};
