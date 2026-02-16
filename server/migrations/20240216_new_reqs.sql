-- Migration for New Requirements: Prospects, Commodity, and Optional Contact Info

-- 1. Update deals status check constraint to include 'PROSPECT'
-- We drop the existing constraint (naming convention assumed) and re-add it with the new value.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_status_check') THEN 
        ALTER TABLE deals DROP CONSTRAINT deals_status_check; 
    END IF; 
END $$;

ALTER TABLE deals ADD CONSTRAINT deals_status_check 
    CHECK (status IN ('PROSPECT', 'PENDING', 'CONTACTADO', 'CITA', 'PROCESO_COTIZACION', 'COTIZACION_ENVIADA', 'CERRADO_GANADO', 'CERRADO_PERDIDO'));

-- 2. Add 'rejection_reason' to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Add 'commodity' to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS commodity TEXT;

-- 4. Make contact fields optional in clients table
ALTER TABLE clients ALTER COLUMN email DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN contact_name DROP NOT NULL;
