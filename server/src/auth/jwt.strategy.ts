import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private supabaseUrl: string;
    private supabaseKey: string;

    constructor(configService: ConfigService) {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        const supabaseKey = configService.get<string>('SUPABASE_KEY');

        if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials not defined');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
            }),
            algorithms: ['RS256', 'HS256', 'ES256'],
            audience: 'authenticated',
            passReqToCallback: true,
        });

        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
    }

    async validate(req: any, payload: any) {
        const userId = payload.sub;

        const rawHeader = req.headers.authorization;
        const token = rawHeader ? rawHeader.split(' ')[1] : null;

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        const scopedSupabase = createClient(this.supabaseUrl, this.supabaseKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        const { data: profile, error } = await scopedSupabase
            .from('profiles')
            .select('is_active, role')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Supabase query error:', error);
            throw new UnauthorizedException('Error verifying user status');
        }

        if (!profile) {
            console.warn(`Profile not found for user ${userId}. potentially blocked by RLS or user missing.`);
            throw new UnauthorizedException('User profile not found or access denied');
        }

        if (profile.is_active === false) {
            throw new UnauthorizedException('User is inactive');
        }

        return {
            userId: payload.sub,
            email: payload.email,
            role: profile.role,
            ...payload
        };
    }
}
