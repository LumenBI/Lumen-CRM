import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UsersService {
    constructor() { }

    private getClient(token: string) {
        if (!token) throw new Error('Authorization token is required');
        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
    }

    async findAll(token: string) {
        const supabase = this.getClient(token);

        // 1. Get registered profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesError) throw new Error(profilesError.message);

        // 2. Get pending invites
        const { data: invites, error: invitesError } = await supabase
            .from('user_invites')
            .select('*')
            .order('created_at', { ascending: false });

        if (invitesError) throw new Error(invitesError.message);

        // 3. Merge lists
        // If an email exists in profiles, it's a registered user.
        // If it only exists in invites, it's 'PENDING'.
        const registeredEmails = new Set(profiles?.map(p => p.email));

        const pendingInvites = invites?.filter(i => !registeredEmails.has(i.email)).map(i => ({
            id: `invite-${i.email}`, // Temporary ID for frontend key
            email: i.email,
            full_name: 'Pendiente de Registro',
            role: i.role,
            is_active: false,
            status: 'PENDING', // UI Status
            created_at: i.created_at
        })) || [];

        const validProfiles = profiles?.map(p => ({
            ...p,
            status: p.is_active ? 'ACTIVE' : 'INACTIVE'
        })) || [];

        return [...pendingInvites, ...validProfiles];
    }

    async createInvite(token: string, payload: { email: string; role: string }) {
        const supabase = this.getClient(token);

        // Check if user already exists in profiles
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', payload.email)
            .single();

        if (existingProfile) {
            throw new Error('User is already registered.');
        }

        const { data, error } = await supabase
            .from('user_invites')
            .insert({
                email: payload.email,
                role: payload.role || 'SALES_REP'
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async toggleStatus(token: string, userId: string, isActive: boolean) {
        const supabase = this.getClient(token);

        const { data, error } = await supabase
            .from('profiles')
            .update({ is_active: isActive })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
}
