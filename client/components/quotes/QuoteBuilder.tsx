"use client"

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash, Save, Send, Loader2 } from "lucide-react";
import { ServiceAutocomplete } from './ServiceAutocomplete';
import { CurrencySelector } from './CurrencySelector';
import { QuotePreviewModal } from './QuotePreviewModal';
import { toast } from "sonner";
import { useApi } from '@/hooks/useApi';

interface QuoteItem {
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
}

interface QuoteFormValues {
    deal_id: string;
    currency: string;
    valid_until: string;
    items: QuoteItem[];
}

interface QuoteBuilderProps {
    dealId?: string;
    clientName?: string;
    clientEmail?: string;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ dealId, clientName, clientEmail }) => {
    const api = useApi();
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState(520);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [createdQuote, setCreatedQuote] = useState<{ id: string; quote_number: number } | null>(null);
    const [creating, setCreating] = useState(false);

    const { register, control, handleSubmit, watch, setValue } = useForm<QuoteFormValues>({
        defaultValues: {
            deal_id: dealId ?? '',
            currency: 'USD',
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const watchItems = watch("items");
    const subtotal = watchItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    const validUntil = watch('valid_until');

    const hasValidItems = watchItems?.some((i: QuoteItem) => (i.description ?? '').trim() !== '');

    const onSubmit = async (data: QuoteFormValues) => {
        if (dealId) {
            try {
                setCreating(true);
                const quote = await api.quotes.create({
                    deal_id: dealId,
                    currency_code: currency,
                    valid_until: data.valid_until,
                    items: data.items.map((it) => ({
                        description: it.description,
                        quantity: it.quantity ?? 1,
                        unit_price: it.unit_price ?? 0,
                        tax_rate: it.tax_rate ?? 0
                    }))
                });
                setCreatedQuote({ id: quote.id, quote_number: quote.quote_number });
                toast.success('Cotización guardada');
            } catch (e) {
                console.error(e);
                toast.error('Error al guardar la cotización');
            } finally {
                setCreating(false);
            }
        } else {
            toast.info('Guardar borrador disponible cuando la cotización está vinculada a un seguimiento.');
        }
    };

    const handleOpenPreview = async () => {
        if (!hasValidItems) {
            toast.error('Agrega al menos un ítem con descripción.');
            return;
        }
        if (dealId) {
            try {
                setCreating(true);
                const payload = {
                    deal_id: dealId,
                    currency_code: currency,
                    valid_until: validUntil,
                    items: watchItems.map((it: QuoteItem) => ({
                        description: it.description ?? '',
                        quantity: it.quantity ?? 1,
                        unit_price: it.unit_price ?? 0,
                        tax_rate: it.tax_rate ?? 0
                    }))
                };
                const quote = await api.quotes.create(payload);
                setCreatedQuote({ id: quote.id, quote_number: quote.quote_number });
                setIsModalOpen(true);
            } catch (e) {
                console.error(e);
                toast.error('Error al crear la cotización');
            } finally {
                setCreating(false);
            }
        } else {
            setCreatedQuote(null);
            setIsModalOpen(true);
        }
    };

    const handleConfirmSend = async (emailBody: string, pdfBlob: Blob) => {
        const quoteNumber = createdQuote?.quote_number ?? 'DRAFT';
        const quoteId = createdQuote?.id;
        if (!clientEmail) {
            toast.error('Falta el correo del cliente. Abre la cotización desde el Kanban con el cliente seleccionado.');
            return;
        }
        try {
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
                try {
                    const base64data = (reader.result as string)?.split(',')[1];
                    if (!base64data) throw new Error('No se pudo generar el PDF');
                    await api.mail.sendQuote({
                        to: clientEmail,
                        subject: `Cotización #${quoteNumber} - Star Cargo`,
                        message: emailBody + (quoteNumber !== 'DRAFT' ? `\n\nReferencia: Cotización #${quoteNumber}` : ''),
                        pdfBase64: base64data,
                        filename: `Cotizacion-${quoteNumber}.pdf`
                    });
                    if (quoteId) {
                        await api.quotes.updateStatus(quoteId, 'SENT');
                    }
                    if (dealId && quoteId) {
                        await api.deals.move(dealId, 'COTIZACION_ENVIADA');
                    }
                    toast.success('Cotización enviada. El seguimiento pasó a "Cotización enviada".');
                    setIsModalOpen(false);
                } catch (err) {
                    console.error(err);
                    toast.error('Error al enviar la cotización');
                }
            };
        } catch (error) {
            console.error(error);
            toast.error('Error al enviar la cotización');
        }
    };

    return (
        <div className="p-6 space-y-6 bg-white rounded-lg shadow-sm border font-sans">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nueva Cotización</h2>
                    <p className="text-muted-foreground text-sm">Cliente: {clientName || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSubmit(onSubmit)}>
                        <Save className="mr-2 h-4 w-4" /> Guardar Borrador
                    </Button>
                    <Button onClick={handleOpenPreview} disabled={creating} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Previsualizar y Enviar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Moneda</label>
                    <CurrencySelector
                        value={currency}
                        onChange={(val) => { setCurrency(val); setValue('currency', val); }}
                        exchangeRate={exchangeRate}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Válido Hasta</label>
                    <Input type="date" {...register('valid_until')} />
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">Servicio / Descripción</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900 w-24">Cant.</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900 w-32">Precio Unit.</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900 w-32">Total</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {fields.map((field, index) => (
                            <tr key={field.id} className="group hover:bg-gray-50 transition-colors">
                                <td className="p-3">
                                    <div className="flex flex-col gap-2">
                                        <Controller
                                            control={control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <ServiceAutocomplete
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onSelect={(prod) => {
                                                        setValue(`items.${index}.description`, prod.name); // Correctly set the description
                                                        setValue(`items.${index}.unit_price`, prod.price);
                                                    }}
                                                />
                                            )}
                                        />
                                    </div>
                                </td>
                                <td className="p-3 align-top">
                                    <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="h-9" />
                                </td>
                                <td className="p-3 align-top">
                                    <Input type="number" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} className="h-9" />
                                </td>
                                <td className="p-3 font-medium text-gray-900 align-top pt-5">
                                    {((watchItems[index]?.quantity || 0) * (watchItems[index]?.unit_price || 0)).toFixed(2)}
                                </td>
                                <td className="p-3 text-center align-top pt-4">
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-red-500 hover:bg-red-50 h-8 w-8">
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-3 bg-gray-50 border-t">
                    <Button variant="ghost" onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_rate: 0 })} className="text-primary hover:text-primary/80 hover:bg-primary/10">
                        <Plus className="mr-2 h-4 w-4" /> Agregar Ítem
                    </Button>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <div className="text-right space-y-1">
                    <p className="text-2xl font-bold text-gray-900">Total: {currency} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    {currency === 'USD' && (
                        <p className="text-sm text-muted-foreground">Estimado en CRC: ₡{(subtotal * exchangeRate).toLocaleString()}</p>
                    )}
                </div>
            </div>

            <QuotePreviewModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                data={{
                    quote_number: createdQuote?.quote_number ?? 'DRAFT',
                    client_name: clientName,
                    date: new Date().toISOString().split('T')[0],
                    valid_until: validUntil,
                    currency: currency,
                    items: watchItems,
                    total_amount: subtotal
                }}
                onConfirm={handleConfirmSend}
            />
        </div>
    );
};
