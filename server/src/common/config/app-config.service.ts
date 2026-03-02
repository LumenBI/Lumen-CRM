import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AppConfigService {
    constructor(private configService: ConfigService) { }

    get supabaseUrl(): string {
        return this.configService.get<string>('SUPABASE_URL');
    }

    get supabaseKey(): string {
        return this.configService.get<string>('SUPABASE_KEY');
    }

    get supabaseServiceRoleKey(): string {
        return this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    }

    get slackWebhookUrl(): string {
        return this.configService.get<string>('SLACK_WEBHOOK_URL');
    }

    get slackAppId(): string {
        return this.configService.get<string>('SLACK_APP_ID');
    }

    get slackClientId(): string {
        return this.configService.get<string>('SLACK_CLIENT_ID');
    }

    get slackClientSecret(): string {
        return this.configService.get<string>('SLACK_CLIENT_SECRET');
    }

    get slackSigningSecret(): string {
        return this.configService.get<string>('SLACK_SIGNING_SECRET');
    }

    get slackVerificationToken(): string {
        return this.configService.get<string>('SLACK_VERIFICATION_TOKEN');
    }

    get slackAppToken(): string {
        return this.configService.get<string>('SLACK_APP_TOKEN');
    }

    get developerUserId(): string {
        return this.configService.get<string>('DEVELOPER_USER_ID');
    }

    get port(): number {
        return this.configService.get<number>('PORT', 3001);
    }

    get resendApiKey(): string {
        return this.configService.get<string>('RESEND_API_KEY');
    }

    get googleApiKey(): string {
        return this.configService.get<string>('GOOGLE_API_KEY');
    }

    private async getOrganizationSetting(tenantId: string, key: string, defaultValue: string): Promise<string> {
        if (!tenantId) return defaultValue;

        try {
            // We create a local client to avoid circular dependency with SupabaseModule
            const url = this.supabaseUrl;
            const serviceKey = this.supabaseServiceRoleKey;

            if (!url || !serviceKey) return defaultValue;

            const supabase = createClient(url, serviceKey);
            const { data, error } = await supabase
                .from('organizations')
                .select('name, settings')
                .eq('id', tenantId)
                .single();

            if (error || !data) return defaultValue;

            if (key === 'name' && data.name) return data.name;

            const settings = data.settings as Record<string, any>;
            return settings?.[key] || defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Configuración de negocio — MULTI-TENANT (Fase 2)
    // ─────────────────────────────────────────────────────────────────────────

    async getCompanyName(tenantId?: string): Promise<string> {
        const fallback = this.configService.get<string>('APP_COMPANY_NAME') || 'Tu Empresa';
        return this.getOrganizationSetting(tenantId, 'name', fallback);
    }

    async getSystemPrompt(tenantId?: string): Promise<string> {
        const fallback = this.configService.get<string>('AI_SYSTEM_PROMPT') ||
            'Eres un asistente de CRM profesional. Redacta mensajes claros, concisos y formales.';
        return this.getOrganizationSetting(tenantId, 'ai_system_prompt', fallback);
    }

    async getPdfHeaderTitle(tenantId?: string): Promise<string> {
        const fallback = this.configService.get<string>('PDF_HEADER_TITLE') || 'Cotización';
        return this.getOrganizationSetting(tenantId, 'pdf_header_title', fallback);
    }

    async getTermsAndConditions(tenantId?: string): Promise<string> {
        const fallback = this.configService.get<string>('PDF_TERMS') || '';
        return this.getOrganizationSetting(tenantId, 'pdf_terms', fallback);
    }
}

