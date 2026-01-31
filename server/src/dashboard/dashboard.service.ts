import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DashboardService {
    private supabase: SupabaseClient;

    constructor() {
        // Inicializamos el cliente con privilegios de servicio para leer la vista
        // OJO: En producción real, esto debería inyectarse como un provider global
        this.supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY! // Usamos la Key pública por ahora (o la Service Key si necesitaras saltar RLS)
        );
    }

    async getUserStats(userId: string) {
        const { data, error } = await this.supabase
            .from('view_daily_kpis')
            .select('*')
            .eq('agent_id', userId)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(error.message);
        }

        return data || {
            total_contacts: 0,
            virtual_meetings: 0,
            commercial_visits: 0,
            quotes_sent: 0,
            deals_won: 0,
            total_sales_usd: 0
        };
    }
}