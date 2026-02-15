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
        return createClient(this.config.supabaseUrl, this.config.supabaseServiceRoleKey);
    }
}
