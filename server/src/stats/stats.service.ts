import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ClientsService } from '../clients/clients.service';
import { DealsService } from '../deals/deals.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly appointmentsService: AppointmentsService,
    private readonly clientsService: ClientsService,
    private readonly dealsService: DealsService,
  ) { }

  async getAgents(token: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  async getUserStats(token: string, userId: string) {
    const supabase = this.supabaseService.getClient(token);

    const getCADate = (date: Date) => {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    };

    const now = new Date();
    const currentYear = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
      }).format(now),
    );
    const currentMonth = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Guatemala',
        month: 'numeric',
      }).format(now),
    );

    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const startOfCurrentMonthStr = getCADate(startOfCurrentMonth);

    const startOfPrevMonth = new Date(currentYear, currentMonth - 2, 1);
    const startOfPrevMonthStr = getCADate(startOfPrevMonth);

    const { data, error } = await supabase
      .from('view_daily_kpis')
      .select('*')
      .eq('agent_id', userId)
      .gte('report_date', startOfPrevMonthStr);

    if (error) throw new Error(error.message);

    const currentMonthStats = {
      new_prospects: 0,
      total_contacts: 0,
      commercial_visits: 0,
      deals_won: 0,
    };

    const prevMonthStats = {
      new_prospects: 0,
      total_contacts: 0,
      commercial_visits: 0,
      deals_won: 0,
    };

    data?.forEach((record) => {
      const isCurrentMonth = record.report_date >= startOfCurrentMonthStr;
      const target = isCurrentMonth ? currentMonthStats : prevMonthStats;

      target.new_prospects += record.new_prospects || 0;
      target.total_contacts += record.total_contacts || 0;
      target.commercial_visits += record.commercial_visits || 0;
      target.deals_won += record.deals_won || 0;
    });

    const calculateChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    const formatChange = (pct: number) => {
      const sign = pct >= 0 ? '+' : '';
      return `${sign}${pct.toFixed(1)}%`;
    };

    const getTrend = (pct: number) => (pct >= 0 ? 'up' : 'down');

    const newProspectsChange = calculateChange(
      currentMonthStats.new_prospects,
      prevMonthStats.new_prospects,
    );
    const interactionsChange = calculateChange(
      currentMonthStats.total_contacts,
      prevMonthStats.total_contacts,
    );
    const visitsChange = calculateChange(
      currentMonthStats.commercial_visits,
      prevMonthStats.commercial_visits,
    );
    const salesChange = calculateChange(
      currentMonthStats.deals_won,
      prevMonthStats.deals_won,
    );

    return {
      new_prospects: currentMonthStats.new_prospects,
      new_prospects_change: formatChange(newProspectsChange),
      new_prospects_trend: getTrend(newProspectsChange),

      total_interactions: currentMonthStats.total_contacts,
      total_interactions_change: formatChange(interactionsChange),
      total_interactions_trend: getTrend(interactionsChange),

      appointments_count: currentMonthStats.commercial_visits,
      appointments_count_change: formatChange(visitsChange),
      appointments_count_trend: getTrend(visitsChange),

      won_count: currentMonthStats.deals_won,
      won_count_change: formatChange(salesChange),
      won_count_trend: getTrend(salesChange),

      virtual_meetings: 0,
      quotes_sent: 0,
      total_sales_usd: 0,
      total_volume_m3: 0,
    };
  }

  async getHistory(token: string) {
    if (!token) throw new Error('Token is required for history');
    const supabase = this.supabaseService.getClient(token);

    const { data, error } = await supabase
      .from('view_daily_kpis')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(30);

    if (error) throw new Error(error.message);
    return data;
  }

  async getBootstrapData(token: string, userId: string) {
    try {
      const [
        stats,
        clients,
        kanban,
        appointments,
        history,
        activities,
        agents,
      ] = await Promise.all([
        this.getUserStats(token, userId),
        this.clientsService.getClientsList(token, userId, '', undefined, 100, true),
        this.getKanban(token, userId),
        this.appointmentsService.getUpcomingAppointments(token, userId, 20),
        this.getHistory(token),
        this.clientsService.getRecentActivities(token),
        this.getAgents(token),
      ]);

      return {
        stats,
        clients: clients.items,
        kanban,
        appointments,
        history,
        activities,
        agents,
      };
    } catch (error) {
      console.error('Error in getBootstrapData:', error);
      throw error;
    }
  }

  async getKanban(token: string, userId: string) {
    return this.dealsService.getFullKanban(token, userId);
  }
}
