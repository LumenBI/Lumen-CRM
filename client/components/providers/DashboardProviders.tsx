'use client'

import React from 'react'
import { UserProvider } from '@/context/UserContext'
import { DataProvider } from '@/context/DataContext'
import { ClientsProvider } from '@/context/ClientsContext'
import { AgentsProvider } from '@/context/AgentsContext'
import { AppointmentsProvider } from '@/context/AppointmentsContext'
import { DealsProvider } from '@/context/DealsContext'
import { QuickActionsProvider } from '@/context/QuickActionsContext'
import { Toaster } from '@/components/ui/sonner'

export function DashboardProviders({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <DataProvider>
                <AgentsProvider>
                    <ClientsProvider>
                        <AppointmentsProvider>
                            <DealsProvider>
                                <QuickActionsProvider>
                                    {children}
                                    <Toaster />
                                </QuickActionsProvider>
                            </DealsProvider>
                        </AppointmentsProvider>
                    </ClientsProvider>
                </AgentsProvider>
            </DataProvider>
        </UserProvider>
    )
}
