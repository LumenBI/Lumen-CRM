import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
}
