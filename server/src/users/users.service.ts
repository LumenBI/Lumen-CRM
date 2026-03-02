import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) { }

  private getClient(token: string) {
    return this.supabaseService.getClient(token);
  }

  async findAll(token: string) {
    const supabase = this.getClient(token);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw new Error(profilesError.message);

    const { data: invites, error: invitesError } = await supabase
      .from('user_invites')
      .select('*')
      .order('created_at', { ascending: false });

    if (invitesError) throw new Error(invitesError.message);

    const registeredEmails = new Set(profiles?.map((p) => p.email));

    const pendingInvites =
      invites
        ?.filter((i) => !registeredEmails.has(i.email))
        .map((i) => ({
          id: `invite-${i.email}`,
          email: i.email,
          full_name: 'Pendiente de Registro',
          role: i.role,
          is_active: false,
          status: 'PENDING',
          created_at: i.created_at,
        })) || [];

    const validProfiles =
      profiles?.map((p) => ({
        ...p,
        status: p.is_active ? 'ACTIVE' : 'INACTIVE',
      })) || [];

    return [...pendingInvites, ...validProfiles];
  }

  async createInvite(token: string, payload: { email: string; role: string }) {
    const supabase = this.getClient(token);

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', payload.email)
      .single();

    if (existingProfile) {
      throw new Error('User is already registered.');
    }

    const { data: inviter } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    const { data, error } = await supabase
      .from('user_invites')
      .insert({
        email: payload.email,
        role: payload.role || 'SALES_REP',
        organization_id: inviter?.organization_id
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
