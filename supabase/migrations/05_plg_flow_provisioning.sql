-- 1. Tablas Base para Multitenancy
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE, -- Único para agrupar dominios corporativos
    industry TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Actualizar Tabla de Perfiles (Respetando el ENUM user_role actual)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
-- Nota: La columna "role" ya existe en la DB como public.user_role

-- 3. Función de Extracción de Dominio
CREATE OR REPLACE FUNCTION public.extract_domain(email TEXT)
RETURNS TEXT AS $$
DECLARE
    parts TEXT[];
    domain_part TEXT;
BEGIN
    parts := string_to_array(email, '@');
    IF array_length(parts, 1) < 2 THEN
        RETURN NULL;
    END IF;
    domain_part := lower(parts[2]);
    
    -- Lista negra de dominios públicos
    IF domain_part IN ('gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'protonmail.com') THEN
        RETURN NULL;
    END IF;
    
    RETURN domain_part;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Trigger de Auto-Provisioning (PLG Flow) CORREGIDO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_domain TEXT;
    org_id UUID;
    is_first_user BOOLEAN;
    clean_email TEXT;
BEGIN
    clean_email := lower(trim(NEW.email));
    target_domain := public.extract_domain(clean_email);
    
    -- LÓGICA DE ORGANIZACIÓN CORREGIDA
    IF target_domain IS NULL THEN
        -- Es un correo público (Ej. Gmail). Creamos un Workspace personal aislado.
        -- Usamos el correo completo como "domain" para que no choque la restricción UNIQUE.
        INSERT INTO public.organizations (name, domain)
        VALUES (
            initcap(split_part(clean_email, '@', 1)) || '''s Workspace', 
            clean_email 
        )
        RETURNING id INTO org_id;
        is_first_user := true;
    ELSE
        -- Es un correo corporativo. Buscamos si la empresa ya existe.
        SELECT id INTO org_id FROM public.organizations WHERE domain = target_domain;
        
        IF org_id IS NULL THEN
            -- La empresa no existe, la creamos
            INSERT INTO public.organizations (name, domain)
            VALUES (initcap(split_part(target_domain, '.', 1)), target_domain)
            RETURNING id INTO org_id;
            is_first_user := true;
        ELSE
            -- La empresa ya existe, el usuario es un empleado más
            is_first_user := false;
        END IF;
    END IF;

    -- Crear el Perfil Automático (Usando casting para el ENUM user_role)
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        organization_id, 
        role,
        is_active
    )
    VALUES (
        NEW.id,
        clean_email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', clean_email),
        org_id,
        CASE WHEN is_first_user THEN 'ADMIN'::public.user_role ELSE 'SALES_REP'::public.user_role END,
        true
    )
    ON CONFLICT (id) DO UPDATE 
    SET organization_id = EXCLUDED.organization_id;

    -- Inyectar organization_id en App Metadata (CORREGIDO CON COALESCE)
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('organization_id', org_id)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Crear el Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
