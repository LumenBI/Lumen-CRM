import { SupabaseClient } from '@supabase/supabase-js'

export async function getDashboardStats(supabase: SupabaseClient, userId: string) {
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

    if (error || !data) {
        return {
            new_prospects: 0, new_prospects_change: '+0.0%', new_prospects_trend: 'up',
            total_interactions: 0, total_interactions_change: '+0.0%', total_interactions_trend: 'up',
            appointments_count: 0, appointments_count_change: '+0.0%', appointments_count_trend: 'up',
            won_count: 0, won_count_change: '+0.0%', won_count_trend: 'up',
        };
    }

    const currentMonthStats = { new_prospects: 0, total_contacts: 0, commercial_visits: 0, deals_won: 0 };
    const prevMonthStats = { new_prospects: 0, total_contacts: 0, commercial_visits: 0, deals_won: 0 };

    data.forEach((record) => {
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

    const newProspectsChange = calculateChange(currentMonthStats.new_prospects, prevMonthStats.new_prospects);
    const interactionsChange = calculateChange(currentMonthStats.total_contacts, prevMonthStats.total_contacts);
    const visitsChange = calculateChange(currentMonthStats.commercial_visits, prevMonthStats.commercial_visits);
    const salesChange = calculateChange(currentMonthStats.deals_won, prevMonthStats.deals_won);

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
    };
}
