"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BrainCircuit, CheckCircle, AlertTriangle, X } from "lucide-react";
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useApi } from '@/hooks/useApi';

const PDFViewerComponent = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFViewer), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-gray-500">Cargando visor de PDF...</div>,
});

const QuotePDF = dynamic(() => import('./QuotePDF').then(mod => mod.QuotePDF), {
    ssr: false,
});

interface QuotePreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: any; // Quote Data
    onConfirm: (emailBody: string, pdfBlob: Blob) => Promise<void>;
}

export const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({ open, onOpenChange, data, onConfirm }) => {
    const api = useApi();
    const [step, setStep] = useState<'ai' | 'review'>('ai');
    const [aiDraft, setAiDraft] = useState("");
    const [loading, setLoading] = useState(false);
    const [analyzingPrices, setAnalyzingPrices] = useState(false);
    const [emailBody, setEmailBody] = useState("");
    const [priceAlert, setPriceAlert] = useState<string | null>(null);

    useEffect(() => {
        if (open && step === 'ai') {
            generateAiDraft();
        }
    }, [open]);

    const generateAiDraft = async () => {
        setLoading(true);
        setAnalyzingPrices(true);
        try {
            const draft = await api.ai.smartDraft({
                quote_number: data.quote_number?.toString() ?? 'BORRADOR',
                company_name: data.company_name ?? data.client_name ?? 'Cliente',
                items: (data.items ?? []).map((i: { description?: string }) => ({ description: i.description ?? '' })),
                valid_until: data.valid_until,
                currency: data.currency
            });
            setAiDraft(draft || `Estimado ${data.client_name || 'Cliente'},\n\nAdjunto encontrará la cotización #${data.quote_number ?? 'xxx'}.\n\nSaludos,\nStar Cargo.`);
            if (data.items?.some((i: { unit_price?: number }) => Number(i?.unit_price) < 100)) {
                setPriceAlert("Posible error: Precios muy bajos detectados.");
            }
        } catch (e) {
            console.error(e);
            setAiDraft(`Estimado ${data.client_name || 'Cliente'},\n\nAdjunto encontrará la cotización formal #${data.quote_number || 'xxx'} para el servicio solicitado.\n\nQuedamos atentos a sus comentarios.\n\nSaludos,\nStar Cargo Team`);
        } finally {
            setLoading(false);
            setAnalyzingPrices(false);
        }
    };

    const handleStepToReview = () => {
        setEmailBody(aiDraft);
        setStep('review');
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const handleConfirmSend = async () => {
        try {
            setLoading(true);
            const [{ pdf }, { QuotePDF: RawQuotePDF }] = await Promise.all([
                import('@react-pdf/renderer'),
                import('./QuotePDF')
            ]);
            const blob = await pdf(<RawQuotePDF data={data} />).toBlob();
            await onConfirm(emailBody, blob);
            onOpenChange(false);
        } catch (error) {
            console.error("Error sending quote", error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">Revisión y Envío de Cotización</h2>
                        <p className="text-sm text-muted-foreground">
                            {step === 'ai' ? "El sistema está analizando la cotización y redactando una propuesta." : "Revise el documento y el correo antes de enviar."}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden p-4 bg-slate-50">
                    {step === 'ai' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            {loading ? (
                                <>
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Analizando ítems con Gemini...</p>
                                </>
                            ) : (
                                <div className="w-full max-w-md bg-white border border-purple-200 p-6 rounded-lg text-center shadow-sm">
                                    <BrainCircuit className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                                    <h3 className="font-semibold text-purple-900 mb-2">Smart Draft Generado</h3>
                                    <p className="text-sm text-purple-800 mb-4 italic p-4 bg-purple-50 rounded">"{aiDraft}"</p>

                                    {priceAlert && (
                                        <div className="bg-yellow-100 p-2 rounded mb-4 text-xs text-yellow-800 flex items-center justify-center gap-2">
                                            <AlertTriangle className="h-3 w-3" /> {priceAlert}
                                        </div>
                                    )}

                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" onClick={() => { setEmailBody(""); setStep('review'); }}>Descartar IA</Button>
                                        <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleStepToReview}>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Usar Propuesta
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="flex flex-col md:flex-row gap-4 h-full">
                            <div className="w-full md:w-1/2 flex flex-col gap-2 h-full">
                                <label className="text-sm font-medium text-gray-700">Cuerpo del Correo</label>
                                <Textarea
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    className="flex-1 resize-none bg-white font-sans"
                                    placeholder="Escriba su mensaje aquí..."
                                />
                            </div>
                            <div className="w-full md:w-1/2 border rounded-lg overflow-hidden bg-gray-100 flex flex-col h-full shadow-inner">
                                <div className="p-2 bg-white border-b text-xs font-semibold text-center text-gray-600">Vista Previa PDF</div>
                                <div className="flex-1 relative">
                                    <PDFViewerComponent className="w-full h-full" showToolbar={false}>
                                        <QuotePDF data={data} />
                                    </PDFViewerComponent>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t flex justify-end gap-2 bg-white">
                    {step === 'review' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('ai')}>Atrás</Button>
                            <Button onClick={handleConfirmSend} disabled={loading} className="min-w-[150px]">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Confirmar y Enviar
                            </Button>
                        </>
                    )}
                    {step === 'ai' && !loading && (
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
