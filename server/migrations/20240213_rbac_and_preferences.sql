-- 1. Add preferences column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "personal": {
    "appointments": {"inApp": true, "email": false},
    "deals": {"inApp": true, "email": false},
    "follows": {"inApp": true, "email": false}
  },
  "team": {
    "appointments": {"inApp": false, "email": false},
    "deals": {"inApp": true, "email": false},
    "follows": {"inApp": false, "email": false}
  }
}'::jsonb;

-- 2. Create permissions table (Optional, for documentation/management)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL, -- ADMIN, MANAGER, AGENT
    permission_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission_name)
);

-- 4. Seed basic permissions
INSERT INTO role_permissions (role, permission_name) VALUES
('ADMIN', 'deals.create'),
('ADMIN', 'deals.edit'),
('ADMIN', 'deals.delete'),
('ADMIN', 'appointments.create'),
('ADMIN', 'users.manage'),
('MANAGER', 'deals.create'),
('MANAGER', 'deals.edit'),
('MANAGER', 'appointments.create'),
('AGENT', 'deals.create'),
('AGENT', 'appointments.create')
ON CONFLICT DO NOTHING;
