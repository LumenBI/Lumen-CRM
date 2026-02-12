import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    getClient(token: string): SupabaseClient {
        if (!token) throw new Error('Authorization token is required');
        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
    }
}
