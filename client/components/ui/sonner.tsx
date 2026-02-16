'use client'

import { Toaster as Sonner } from 'sonner'
import { useTheme } from 'next-themes'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200/60 group-[.toaster]:shadow-[0_20px_50px_rgba(0,0,0,0.1)] group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:font-medium dark:group-[.toaster]:bg-slate-950 dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-slate-800",
                    description: "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400",
                    actionButton:
                        "group-[.toast]:bg-blue-600 group-[.toast]:text-white dark:group-[.toast]:bg-blue-500",
                    cancelButton:
                        "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 dark:group-[.toast]:bg-slate-800",
                    success: "group-[.toast]:border-green-100 group-[.toast]:bg-green-50/30",
                    error: "group-[.toast]:border-red-100 group-[.toast]:bg-red-50/30",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
