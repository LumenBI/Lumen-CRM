"use client"
import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { Quote } from '@/types';
import dynamic from 'next/dynamic';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

const QuotePDFView = dynamic(() => import('./QuotePDFView'), {
    ssr: false,
    loading: () => <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
        <Loader2 className="animate-spin" />
        <p>Cargando visor de PDF...</p>
    </div>
});

interface QuoteViewProps {
    quoteId: string;
    clientEmail: string;
}

export const QuoteView: React.FC<QuoteViewProps> = ({ quoteId, clientEmail }) => {
    const api = useApi();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const data = await api.quotes.getById(quoteId);
                setQuote(data);
            } catch (error) {
                toast.error('Error al cargar cotización');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, [quoteId, api.quotes]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const handleSendEmail = async () => {
        if (!quote) return;
        setSending(true);
        try {
            const [{ pdf }, { QuoteDocument: RawQuoteDocument }] = await Promise.all([
                import('@react-pdf/renderer'),
                import('./QuoteDocument')
            ]);

            // Explicitly pass only necessary data to avoid serialization issues
            const blob = await pdf(
                <RawQuoteDocument
                    quote={quote}
                    items={quote.quote_items || []}
                    currency={quote.currency_code || 'USD'}
                />
            ).toBlob();

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = (reader.result as string).split(',')[1];

                const messageWithRef = `Adjunto encontrará la cotización solicitada.\n\nReferencia: Cotización #${quote.quote_number}`;
                await api.mail.sendQuote({
                    to: clientEmail,
                    subject: `Cotización #${quote.quote_number} - Star Cargo`,
                    message: messageWithRef,
                    pdfBase64: base64data,
                    filename: `Cotizacion-${quote.quote_number}.pdf`
                });

                await api.quotes.updateStatus(quote.id, 'SENT');
                if (quote.deal_id) {
                    await api.deals.move(quote.deal_id, 'COTIZACION_ENVIADA');
                }
                toast.success('Cotización enviada. El seguimiento pasó a "Cotización enviada".');
                setSending(false);
            };
        } catch (error) {
            console.error(error);
            toast.error('Error al enviar el correo');
            setSending(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
    if (!quote) return <div className="p-8 text-center text-gray-500 border rounded bg-gray-50">No se encontró la cotización</div>;

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Cotización #{quote.quote_number}</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleSendEmail}
                        disabled={sending}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm active:scale-95"
                    >
                        {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                        Enviar por Correo
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-[600px] border rounded-xl overflow-hidden bg-white shadow-sm border-gray-100">
                <QuotePDFView quote={quote} items={quote.quote_items || []} />
            </div>
        </div>
    );
};
