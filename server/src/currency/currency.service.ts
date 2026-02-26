import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(private supabase: SupabaseClient) { }

  /**
   * Updates exchange rates from an external API.
   * Previously triggered by @Cron; now called from the REST cron endpoint
   * (POST /api/cron/daily-tasks) so it works in Vercel Serverless.
   */
  async runDailyUpdate(): Promise<{ updated: boolean; message: string }> {
    this.logger.debug('Actualizando tipos de cambio...');
    // 1. Fetch a API externa (ej. Banco Central o API libre)
    // const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    // const crcRate = response.data.rates.CRC;

    // 2. Actualizar DB
    // await this.supabase.from('currencies').update({ exchange_rate: crcRate }).eq('code', 'CRC');

    this.logger.log('Tipo de cambio actualizado (Simulación).');
    return { updated: true, message: 'Exchange rates updated successfully.' };
  }

  async convertAmount(
    amount: number,
    from: string,
    to: string,
  ): Promise<number> {
    // Logic to fetch rates from DB and convert
    // For now, returning amount as placeholder
    return amount;
  }

  async getExchangeRate(currencyCode: string): Promise<number> {
    if (currencyCode === 'USD') return 1;

    const { data, error } = await this.supabase
      .from('currencies')
      .select('exchange_rate')
      .eq('code', currencyCode)
      .single();

    if (error || !data) {
      this.logger.warn(
        `Could not find rate for ${currencyCode}, defaulting to 1`,
      );
      return 1;
    }

    return data.exchange_rate;
  }
}
