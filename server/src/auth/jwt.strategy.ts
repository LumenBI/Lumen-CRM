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
        // Diagnostic log to catch the "stringified session" bug
        if (typeof payload === 'string') {
            console.error('CRITICAL: JwtStrategy received a string payload instead of an object:', payload.substring(0, 100) + '...');
            try {
                payload = JSON.parse(payload);
                console.log('Successfully auto-parsed string payload.');
            } catch (e) {
                console.error('Failed to parse string payload as JSON.');
                throw new UnauthorizedException('Invalid token payload format');
            }
        }

        const userId = payload.sub;
        if (!userId) {
            console.error('No sub (userId) found in payload:', payload);
            throw new UnauthorizedException('Invalid token payload');
        }

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

        // Return a fresh object to avoid any prototype pollution or weirdness if payload was a string
        return {
            userId: userId,
            email: payload.email,
            role: profile.role,
            ...(typeof payload === 'object' ? payload : {})
        };
    }
}
