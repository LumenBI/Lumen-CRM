"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BrainCircuit, CheckCircle, AlertTriangle, X } from "lucide-react";
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useApi } from '@/hooks/useApi';

const QuotePDFPreview = dynamic(() => import('./QuotePDFPreview'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Cargando visor de PDF...</p>
    </div>,
});

interface QuotePreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: any; // Quote Data
    onConfirm: (emailBody: string, pdfBlob: Blob) => Promise<void>;
}

const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({ open, onOpenChange, data, onConfirm }) => {
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
                company_name: data.company_name ?? data.client_name ?? 'Cliente',
                quote_number: data.quote_number,
                currency: data.currency,
                valid_until: data.valid_until,
                total_amount: data.total_amount,
                items: (data.items ?? []).map((i: { description?: string }) => ({ description: i.description ?? '' })),
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

            // Explicitly pass sanitized data
            const sanitizedData = {
                ...data,
                items: (data.items || []).map((i: any) => ({
                    description: i.description || '',
                    quantity: Number(i.quantity) || 0,
                    unit_price: Number(i.unit_price) || 0
                }))
            };

            const blob = await pdf(<RawQuotePDF data={sanitizedData} />).toBlob();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Revisión y Envío de Cotización</h2>
                        <p className="text-sm text-gray-500">
                            {step === 'ai' ? "El sistema está analizando la cotización y redactando una propuesta." : "Revise el documento y el correo antes de enviar."}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-gray-200">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden p-6 bg-slate-50">
                    {step === 'ai' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-6">
                            {loading ? (
                                <>
                                    <div className="relative">
                                        <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                        <BrainCircuit className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-medium text-gray-700">Analizando con Gemini AI...</p>
                                        <p className="text-sm text-gray-500">Estamos redactando la mejor propuesta para tu cliente.</p>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full max-w-lg bg-white border border-purple-100 p-8 rounded-2xl text-center shadow-xl transform transition-all hover:scale-[1.02]">
                                    <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <BrainCircuit className="h-10 w-10 text-purple-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Draft Generado</h3>
                                    <div className="text-left text-sm text-gray-700 mb-6 italic p-4 bg-purple-50/50 rounded-xl border border-purple-50">
                                        "{aiDraft}"
                                    </div>

                                    {priceAlert && (
                                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-6 text-sm text-amber-800 flex items-center gap-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                                            <span className="text-left">{priceAlert}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-3 justify-center">
                                        <Button variant="outline" onClick={() => { setEmailBody(""); setStep('review'); }} className="px-6">Descartar IA</Button>
                                        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 shadow-md shadow-purple-200" onClick={handleStepToReview}>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Usar Propuesta
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="flex flex-col md:flex-row gap-6 h-full">
                            <div className="w-full md:w-1/3 flex flex-col gap-4 h-full">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        Cuerpo del Correo
                                    </label>
                                    <Textarea
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        className="h-[400px] resize-none bg-white font-sans border-gray-200 focus:ring-primary rounded-xl p-4 text-gray-800 leading-relaxed shadow-sm"
                                        placeholder="Escriba su mensaje aquí..."
                                    />
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                                    <p className="font-semibold mb-1">Tip:</p>
                                    Puedes personalizar este mensaje antes de enviarlo. El PDF se adjuntará automáticamente.
                                </div>
                            </div>
                            <div className="w-full md:w-2/3 border rounded-2xl overflow-hidden bg-gray-200 flex flex-col h-full shadow-inner border-gray-200">
                                <div className="p-3 bg-white border-b text-xs font-bold text-center text-gray-500 uppercase tracking-wider">Vista Previa del Documento</div>
                                <div className="flex-1 relative">
                                    <QuotePDFPreview data={data} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t flex justify-end gap-3 bg-white">
                    {step === 'review' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('ai')} className="rounded-lg px-6">Atrás</Button>
                            <Button onClick={handleConfirmSend} disabled={loading} className="min-w-[180px] rounded-lg px-8 shadow-lg shadow-primary/20 bg-blue-600 hover:bg-blue-700">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Confirmar y Enviar
                            </Button>
                        </>
                    )}
                    {step === 'ai' && !loading && (
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg px-6">Cancelar</Button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default QuotePreviewModal;
