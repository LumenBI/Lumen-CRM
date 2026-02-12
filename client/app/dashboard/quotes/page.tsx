"use client"

import React, { Suspense } from 'react';
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder';
import { useSearchParams } from 'next/navigation';

function QuotesContent() {
    const searchParams = useSearchParams();
    const dealId = searchParams.get('dealId') || undefined;
    const clientName = searchParams.get('clientName') || 'N/A';

    return (
        <QuoteBuilder
            dealId={dealId}
            clientName={clientName}
        />
    );
}

export default function QuotesPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-[#000d42]">Gestión de Cotizaciones</h1>
                <p className="text-slate-500 text-sm">Cree y envíe cotizaciones inteligentes con soporte de IA.</p>
            </div>

            <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium animate-pulse">Cargando constructor de cotización...</div>}>
                <QuotesContent />
            </Suspense>
        </div>
    );
}
