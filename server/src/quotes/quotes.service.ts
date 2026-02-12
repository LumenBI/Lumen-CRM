import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class QuotesService {
    private getClient(token: string): SupabaseClient {
        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
            { global: { headers: { Authorization: token } } } // Token handles RLS
        );
    }

    async createQuote(token: string, data: any) {
        const supabase = this.getClient(token);

        // 1. Create Quote
        const { data: quote, error } = await supabase
            .from('quotes')
            .insert({
                deal_id: data.deal_id,
                status: 'DRAFT',
                currency_code: data.currency_code,
                exchange_rate_snapshot: data.exchange_rate_snapshot || 1,
                valid_until: data.valid_until,
            })
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);

        // 2. Create Items
        if (data.items && data.items.length > 0) {
            const items = data.items.map((item: any) => ({
                quote_id: quote.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate || 0,
            }));

            const { error: itemsError } = await supabase.from('quote_items').insert(items);
            if (itemsError) throw new InternalServerErrorException(itemsError.message);
        }

        return quote;
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
}
