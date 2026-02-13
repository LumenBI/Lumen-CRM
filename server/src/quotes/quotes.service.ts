import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class QuotesService {
    constructor(private currencyService: CurrencyService) { }

    private getClient(token: string): SupabaseClient {
        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
            { global: { headers: { Authorization: token } } } // Token handles RLS
        );
    }

    async createQuote(token: string, data: any) {
        const supabase = this.getClient(token);

        // Prepare payload for RPC
        const exchangeRate = data.exchange_rate_snapshot || await this.currencyService.getExchangeRate(data.currency_code);

        const quoteJson = {
            deal_id: data.deal_id || null,
            status: 'DRAFT',
            currency_code: data.currency_code,
            exchange_rate_snapshot: exchangeRate,
            valid_until: data.valid_until,
            version: 1, // Start at version 1
        };

        const itemsJson = data.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate || 0,
        }));

        // Call RPC for atomic transaction
        const { data: quote, error } = await supabase.rpc('create_quote_rpc', {
            quote_json: quoteJson,
            items_json: itemsJson,
        });

        if (error) throw new InternalServerErrorException(error.message);

        return quote;
    }

    async cloneQuote(token: string, originalQuoteId: string) {
        const supabase = this.getClient(token);

        // 1. Fetch original quote and items
        const { data: original, error: fetchError } = await supabase
            .from('quotes')
            .select('*, quote_items(*)')
            .eq('id', originalQuoteId)
            .single();

        if (fetchError) throw new InternalServerErrorException(fetchError.message);

        // 2. Prepare new quote payload based on original
        const newVersion = (original.version || 1) + 1;
        const quoteJson = {
            deal_id: original.deal_id,
            status: 'DRAFT',
            currency_code: original.currency_code,
            exchange_rate_snapshot: original.exchange_rate_snapshot, // Keep original rate or refresh? Usually keep for history, but new quote might need new rate. 
            // Requirement says "Copy all data...". IF editing a SENT quote, it's a new negotiation, likely keep rate OR refresh. 
            // User spec: "Duplicar todos los quote_items... Marcar anterior como Obsoleta".
            // Let's assume we keep the snapshot for the *start* of the revision, but user might update it in UI.
            valid_until: original.valid_until,
            version: newVersion,
            quote_number: original.quote_number // Keep same quote number for grouping
        };

        const itemsJson = original.quote_items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
        }));

        // 3. Call RPC
        const { data: newQuote, error: rpcError } = await supabase.rpc('create_quote_rpc', {
            quote_json: quoteJson,
            items_json: itemsJson,
        });

        if (rpcError) throw new InternalServerErrorException(rpcError.message);

        // 4. Mark original as OBSOLETE (Optional based on preference, or just leave as SENT/HISTORY)
        // User spec: "Marcar la anterior como 'Obsoleta'"
        // We'll update the status if the schema supports 'OBSOLETE' or similar. 
        // If not strictly defined enum, we will try 'OBSOLETE'.
        await supabase.from('quotes').update({ status: 'OBSOLETE' }).eq('id', originalQuoteId);

        return newQuote;
    }

    async getQuotesByDeal(token: string, dealId: string) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('quotes')
            .select('*, quote_items(*)')
            .eq('deal_id', dealId)
            .order('created_at', { ascending: false });

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async getQuote(token: string, id: string) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('quotes')
            .select('*, quote_items(*)')
            .eq('id', id)
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async updateQuoteStatus(token: string, id: string, status: string, pdfUrl?: string) {
        const supabase = this.getClient(token);
        const updateData: any = { status };
        if (pdfUrl) updateData.pdf_url = pdfUrl;

        const { data, error } = await supabase
            .from('quotes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async markAsSent(token: string, id: string, pdfUrl: string) {
        return this.updateQuoteStatus(token, id, 'SENT', pdfUrl);
    }
}
