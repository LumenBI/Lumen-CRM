import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class SupabaseService {
    constructor(private config: AppConfigService) { }

    getClient(token: string): SupabaseClient {
        if (!token) throw new Error('Authorization token is required');
        return createClient(this.config.supabaseUrl, this.config.supabaseKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
        });
    }

    getAdminClient(): SupabaseClient {
        const key = this.config.supabaseServiceRoleKey;
        if (!key) {
            console.warn('[SupabaseService] WARNING: SUPABASE_SERVICE_ROLE_KEY is missing!');
        } else {
            // console.log(`[SupabaseService] Admin key starts with: ${key.substring(0, 10)}...`);
        }
        return createClient(this.config.supabaseUrl, key || '');
    }
}
