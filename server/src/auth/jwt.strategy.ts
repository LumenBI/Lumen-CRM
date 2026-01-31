import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
            }),
            algorithms: ['ES256'],
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, email: payload.email, ...payload };
    }
}
