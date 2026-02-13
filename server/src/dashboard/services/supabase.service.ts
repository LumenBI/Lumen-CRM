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

    getAdminClient(): SupabaseClient {
        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY! // This is likely the service_role key already if SUPABASE_KEY is used for backends.
        );
    }
}
