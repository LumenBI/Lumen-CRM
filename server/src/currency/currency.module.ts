import { Module } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { SupabaseClient } from '@supabase/supabase-js';

// We need to provide SupabaseClient.
// If it's a global module, we might import it.
// If not, we can create a provider here or import a shared module.
// For now, keeping it simple.

@Module({
  providers: [
    CurrencyService,
    {
      provide: SupabaseClient,
      useFactory: () => {
        // Simple factory to create Supabase client if not already provided globally
        // Ideally this should come from a SharedModule
        const { createClient } = require('@supabase/supabase-js');
        return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      },
    },
  ],
  exports: [CurrencyService],
})
export class CurrencyModule {}
