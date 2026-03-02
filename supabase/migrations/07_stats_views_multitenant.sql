-- Asegurar que las vistas analíticas respeten el organization_id
-- Nota: Esta migración asume la existencia de la vista 'view_daily_kpis' o la prepara para Multitenancy.

-- 1. Si la vista ya existe, intentamos recrearla con organization_id
-- Idealmente, StatsService debería filtrar por profile.organization_id.

CREATE OR REPLACE VIEW public.view_daily_kpis_multitenant AS
SELECT 
    v.*,
    p.organization_id
FROM public.view_daily_kpis v
JOIN public.profiles p ON v.agent_id = p.id;

-- 2. Habilitar RLS en la vista (si Supabase lo soporta en la versión actual)
-- O simplemente asegurar que StatsService use el filtro de organization_id.

COMMENT ON VIEW public.view_daily_kpis_multitenant IS 'Vista de KPIs diarios extendida con organization_id para aislamiento RLS';
