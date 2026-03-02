-- 00_baseline_schema.sql
-- Baseline Schema for Lumen Core (Full DDL)

-- 1. ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('ADMIN', 'MANAGER', 'SALES_REP');
    END IF;
END $$;

-- 2. TABLES

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Aligned with auth.users.id
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role public.user_role DEFAULT 'SALES_REP',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    notification_interval INTEGER DEFAULT 30,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'PENDING',
    origin TEXT DEFAULT 'MANUAL',
    commodity TEXT,
    assigned_agent_id UUID REFERENCES public.profiles(id),
    assignment_expires_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- DEALS
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    value NUMERIC DEFAULT 0, -- Some services use value, some use amount
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'PROSPECT',
    type TEXT DEFAULT 'AEREO',
    assigned_agent_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.profiles(id),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type TEXT DEFAULT 'virtual',
    meeting_link TEXT,
    location TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pendiente',
    rating INTEGER,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- APPOINTMENT PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.appointment_participants (
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (appointment_id, user_id)
);

-- INTERACTIONS
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.profiles(id),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    category TEXT,
    modality TEXT DEFAULT 'VIRTUAL',
    summary TEXT,
    amount_usd NUMERIC DEFAULT 0,
    is_completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- USER INVITES
CREATE TABLE IF NOT EXISTS public.user_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT DEFAULT 'SALES_REP',
    created_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    message TEXT,
    link TEXT DEFAULT '#',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- QUOTES
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'DRAFT',
    currency_code TEXT DEFAULT 'USD',
    exchange_rate_snapshot NUMERIC DEFAULT 1,
    valid_until DATE,
    version INTEGER DEFAULT 1,
    quote_number SERIAL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- QUOTE ITEMS
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    description TEXT,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0
);

-- 3. VIEWS

-- BASIC KPI VIEW (Placeholder for StatsService)
CREATE OR REPLACE VIEW public.view_daily_kpis AS
SELECT 
    assigned_agent_id as agent_id,
    created_at::date as report_date,
    count(*) filter (where status = 'PENDING') as new_prospects,
    0 as total_contacts, -- Placeholder
    0 as commercial_visits, -- Placeholder
    0 as deals_won -- Placeholder
FROM public.clients
GROUP BY assigned_agent_id, created_at::date;
