import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CurrencyService {
    private readonly logger = new Logger(CurrencyService.name);

    // Note: Assuming SupabaseClient is provided via dependency injection or instantiated here.
    // For this example, we'll try to inject it if a module provides it, or instantiated if not.
    // Given the existing project structure likely has a Supabase provider, we'll assume injection.
    constructor(private supabase: SupabaseClient) { }

    // Se ejecuta todos los días a las 8:00 AM
    @Cron('0 8 * * *')
    async handleCron() {
        this.logger.debug('Actualizando tipos de cambio...');
        // 1. Fetch a API externa (ej. Banco Central o API libre)
        // const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        // const crcRate = response.data.rates.CRC;

        // 2. Actualizar DB
        // await this.supabase.from('currencies').update({ exchange_rate: crcRate }).eq('code', 'CRC');
        this.logger.log('Tipo de cambio actualizado (Simulación).');
    }

    async convertAmount(amount: number, from: string, to: string): Promise<number> {
        // Logic to fetch rates from DB and convert
        // For now, returning amount as placeholder
        return amount;
    }

    async getExchangeRate(currencyCode: string): Promise<number> {
        // In a real scenario, this would check the cache or DB.
        // For now, we fetch from the 'currencies' table or return a default/mock.
        if (currencyCode === 'USD') return 1;

        const { data, error } = await this.supabase
            .from('currencies')
            .select('exchange_rate')
            .eq('code', currencyCode)
            .single();

        if (error || !data) {
            this.logger.warn(`Could not find rate for ${currencyCode}, defaulting to 1`);
            return 1; // Fallback
        }

        return data.exchange_rate;
    }
}
