-- 1. Actualización de Tablas Core
-- Nota: Dejamos assigned_agent_id por ahora pero la política de seguridad MANDATORIA será organization_id.

DO $$ 
BEGIN
    -- CLIENTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='organization_id') THEN
        ALTER TABLE public.clients ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;

    -- DEALS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='organization_id') THEN
        ALTER TABLE public.deals ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;

    -- APPOINTMENTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='organization_id') THEN
        ALTER TABLE public.appointments ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;

    -- INTERACTIONS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='organization_id') THEN
        ALTER TABLE public.interactions ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;

    -- USER INVITES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_invites' AND column_name='organization_id') THEN
        ALTER TABLE public.user_invites ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;

    -- NOTIFICATIONS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='organization_id') THEN
        ALTER TABLE public.notifications ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- 2. Habilitar RLS en todas las tablas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS (Seguridad Zero-Trust)
-- La organización se inyecta en el JWT vía raw_app_meta_data['organization_id']

-- Política Genérica: Solo ver/editar lo que pertenece a tu organización
DROP POLICY IF EXISTS "Users can only access their organization data" ON public.clients;
CREATE POLICY "Users can only access their organization data" ON public.clients
    FOR ALL
    USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
    WITH CHECK (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

DROP POLICY IF EXISTS "Users can only access their organization data" ON public.deals;
CREATE POLICY "Users can only access their organization data" ON public.deals
    FOR ALL
    USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
    WITH CHECK (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

DROP POLICY IF EXISTS "Users can only access their organization data" ON public.appointments;
CREATE POLICY "Users can only access their organization data" ON public.appointments
    FOR ALL
    USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
    WITH CHECK (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

DROP POLICY IF EXISTS "Users can only access their organization data" ON public.interactions;
CREATE POLICY "Users can only access their organization data" ON public.interactions
    FOR ALL
    USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
    WITH CHECK (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

DROP POLICY IF EXISTS "Users can only access their organization data" ON public.user_invites;
CREATE POLICY "Users can only access their organization data" ON public.user_invites
    FOR ALL
    USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
    WITH CHECK (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

DROP POLICY IF EXISTS "Users can only access their organization data" ON public.notifications;
CREATE POLICY "Users can only access their organization data" ON public.notifications
    FOR ALL
    USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
    WITH CHECK (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- Perfiles: Solo puedes ver perfiles de tu misma organización
DROP POLICY IF EXISTS "Users can see profiles of their organization" ON public.profiles;
CREATE POLICY "Users can see profiles of their organization" ON public.profiles
    FOR SELECT
    USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- 4. Triggers de Seguridad Forense (Integridad de Datos)
-- Asegura que ningún insert se escape sin organization_id
CREATE OR REPLACE FUNCTION public.enforce_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.organization_id IS NULL THEN
        NEW.organization_id := (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid;
    END IF;
    
    -- Si sigue siendo nulo, error
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'MANDATORY organization_id missing and not found in JWT';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a todas las tablas core
DROP TRIGGER IF EXISTS ensure_client_org_id ON public.clients;
CREATE TRIGGER ensure_client_org_id BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE FUNCTION public.enforce_organization_id();

DROP TRIGGER IF EXISTS ensure_deal_org_id ON public.deals;
CREATE TRIGGER ensure_deal_org_id BEFORE INSERT ON public.deals FOR EACH ROW EXECUTE FUNCTION public.enforce_organization_id();

DROP TRIGGER IF EXISTS ensure_appointment_org_id ON public.appointments;
CREATE TRIGGER ensure_appointment_org_id BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.enforce_organization_id();

DROP TRIGGER IF EXISTS ensure_interaction_org_id ON public.interactions;
CREATE TRIGGER ensure_interaction_org_id BEFORE INSERT ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.enforce_organization_id();

DROP TRIGGER IF EXISTS ensure_notification_org_id ON public.notifications;
CREATE TRIGGER ensure_notification_org_id BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.enforce_organization_id();

DROP TRIGGER IF EXISTS ensure_invite_org_id ON public.user_invites;
CREATE TRIGGER ensure_invite_org_id BEFORE INSERT ON public.user_invites FOR EACH ROW EXECUTE FUNCTION public.enforce_organization_id();
