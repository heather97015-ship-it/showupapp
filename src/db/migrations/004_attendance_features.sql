-- Migration 004: Attendance prevention & recovery features

-- Pre-flight confirmation fields
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS pre_flight_sent_at TIMESTAMPTZ;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS pre_flight_confirmed BOOLEAN NOT NULL DEFAULT false;

-- Add high_risk to job_status enum
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'high_risk';

-- Geofence fields on jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS geofence_radius INTEGER DEFAULT 500;

-- Client notification fields
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_name TEXT;
