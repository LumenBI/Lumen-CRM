'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { DealsProvider } from '@/context/DealsContext'
import { ClientsProvider } from '@/context/ClientsContext'
import { QuickActionsProvider } from '@/context/QuickActionsContext'
import { AppointmentsProvider } from '@/context/AppointmentsContext'
import { UserProvider } from '@/context/UserContext'
import { DataProvider } from '@/context/DataContext'

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 0,
                refetchOnWindowFocus: true,
                retry: 1,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            <UserProvider>
                <DataProvider>
                    <QuickActionsProvider>
                        <DealsProvider>
                            <ClientsProvider>
                                <AppointmentsProvider>
                                    {children}
                                </AppointmentsProvider>
                            </ClientsProvider>
                        </DealsProvider>
                    </QuickActionsProvider>
                </DataProvider>
            </UserProvider>
        </QueryClientProvider>
    )
}
