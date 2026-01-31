-- Migration: Create Appointments Table
-- Description: Adds agenda/calendar functionality for scheduling client interactions
-- Author: Star CRM Development Team
-- Date: 2026-01-30

-- ============================================
-- 1. Create appointments table
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Appointment Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    
    -- Type: 'virtual', 'presencial', 'llamada'
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'virtual',
    
    -- Status: 'pendiente', 'confirmada', 'completada', 'cancelada'
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    
    -- Optional fields
    location VARCHAR(255), -- For presencial meetings
    meeting_link VARCHAR(500), -- For virtual meetings
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================
CREATE INDEX idx_appointments_agent_date ON appointments(agent_id, appointment_date, appointment_time);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_range ON appointments(appointment_date) WHERE status IN ('pendiente', 'confirmada');

-- ============================================
-- 3. Create updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- ============================================
-- 4. Add helpful comments
-- ============================================
COMMENT ON TABLE appointments IS 'Stores scheduled appointments/meetings with clients';
COMMENT ON COLUMN appointments.appointment_type IS 'Type of appointment: virtual, presencial, llamada';
COMMENT ON COLUMN appointments.status IS 'Current status: pendiente, confirmada, completada, cancelada';
COMMENT ON COLUMN appointments.meeting_link IS 'URL for virtual meetings (Zoom, Meet, Teams, etc.)';

-- ============================================
-- 5. Sample data for testing (optional)
-- ============================================
-- Uncomment to insert sample appointments:
/*
INSERT INTO appointments (client_id, agent_id, title, appointment_date, appointment_time, appointment_type, status)
SELECT 
    c.id,
    c.assigned_agent_id,
    'Reunión de seguimiento',
    CURRENT_DATE + INTERVAL '2 days',
    '14:00:00',
    'virtual',
    'confirmada'
FROM clients c
WHERE c.assigned_agent_id IS NOT NULL
LIMIT 3;
*/
