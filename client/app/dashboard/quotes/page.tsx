"use client"

import React, { Suspense } from 'react';
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { FileText } from 'lucide-react';

function QuotesContent() {
    const searchParams = useSearchParams();
    const dealId = searchParams.get('dealId') || undefined;
    const clientName = searchParams.get('clientName') || 'N/A';
    const clientEmail = searchParams.get('clientEmail') || undefined;

    return (
        <QuoteBuilder
            dealId={dealId}
            clientName={clientName}
            clientEmail={clientEmail}
        />
    );
}

export default function QuotesPage() {
    return (
        <div className="space-y-6 p-4 md:p-8">
            <PageHeader
                title="Gestión de Cotizaciones"
                subtitle="Cree y envíe cotizaciones inteligentes con soporte de IA."
                icon={FileText}
            />

            <Suspense fallback={<div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium animate-pulse">Cargando constructor de cotización...</div>}>
                <QuotesContent />
            </Suspense>
        </div>
    );
}
