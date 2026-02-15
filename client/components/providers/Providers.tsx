"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { useSessionGuard } from "@/hooks/reactive/useSessionGuard";
import { useErrorReport } from "@/hooks/reactive/useErrorReport";

export function Providers({ children }: { children: React.ReactNode }) {
    useSessionGuard();
    useErrorReport();

    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 0,
                        refetchOnWindowFocus: true,
                        refetchOnMount: true,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
