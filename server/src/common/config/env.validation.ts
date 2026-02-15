import { IsNotEmpty, IsString, IsOptional, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

class EnvironmentVariables {
    @IsString()
    @IsNotEmpty()
    SUPABASE_URL: string;

    @IsString()
    @IsNotEmpty()
    SUPABASE_KEY: string;

    @IsString()
    @IsNotEmpty()
    SUPABASE_SERVICE_ROLE_KEY: string;

    @IsString()
    @IsOptional()
    SLACK_WEBHOOK_URL?: string;

    @IsString()
    @IsOptional()
    SLACK_APP_ID?: string;

    @IsString()
    @IsOptional()
    SLACK_CLIENT_ID?: string;

    @IsString()
    @IsOptional()
    SLACK_CLIENT_SECRET?: string;

    @IsString()
    @IsOptional()
    SLACK_SIGNING_SECRET?: string;

    @IsString()
    @IsOptional()
    SLACK_VERIFICATION_TOKEN?: string;

    @IsString()
    @IsOptional()
    SLACK_APP_TOKEN?: string;

    @IsString()
    @IsOptional()
    DEVELOPER_USER_ID?: string;

    @IsString()
    @IsOptional()
    PORT?: string = '3001';

    @IsString()
    @IsOptional()
    RESEND_API_KEY?: string;

    @IsString()
    @IsOptional()
    GOOGLE_API_KEY?: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}
