-- Migration 001: Initial schema for ShowUp
-- Tables: cleaners, jobs, attendance_logs, points_transactions, owner_settings

----------------------------------------------------------------------
-- Cleaners
----------------------------------------------------------------------
CREATE TABLE cleaners (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    phone             TEXT,
    email             TEXT,
    reliability_score INTEGER NOT NULL DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    points_balance    INTEGER NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

----------------------------------------------------------------------
-- Jobs
----------------------------------------------------------------------
CREATE TYPE job_status AS ENUM (
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'no_show'
);

CREATE TABLE jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               TEXT NOT NULL,
    description         TEXT,
    scheduled_date      DATE NOT NULL,
    scheduled_time      TIME NOT NULL,
    location            TEXT NOT NULL,
    assigned_cleaner_id UUID REFERENCES cleaners(id) ON DELETE SET NULL,
    status              job_status NOT NULL DEFAULT 'pending',
    backup_cleaner_id   UUID REFERENCES cleaners(id) ON DELETE SET NULL,
    backup_deployed_at  TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_assigned_cleaner ON jobs(assigned_cleaner_id);

----------------------------------------------------------------------
-- Attendance logs
----------------------------------------------------------------------
CREATE TYPE attendance_status AS ENUM (
    'ontime',
    'late',
    'no_show'
);

CREATE TABLE attendance_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    cleaner_id          UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    confirmed           BOOLEAN NOT NULL DEFAULT false,
    confirmed_at        TIMESTAMPTZ,
    actual_arrival_time TIMESTAMPTZ,
    status              attendance_status,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendance_job ON attendance_logs(job_id);
CREATE INDEX idx_attendance_cleaner ON attendance_logs(cleaner_id);

----------------------------------------------------------------------
-- Points transactions
----------------------------------------------------------------------
CREATE TABLE points_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleaner_id      UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    points          INTEGER NOT NULL,
    reason          TEXT NOT NULL,
    reference_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_points_cleaner ON points_transactions(cleaner_id);
CREATE INDEX idx_points_job ON points_transactions(reference_job_id);

----------------------------------------------------------------------
-- Owner settings
----------------------------------------------------------------------
CREATE TABLE owner_settings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name        TEXT,
    owner_email          TEXT,
    backup_auto_deploy   BOOLEAN NOT NULL DEFAULT true,
    points_per_on_time   INTEGER NOT NULL DEFAULT 10,
    points_per_backup    INTEGER NOT NULL DEFAULT 25,
    penalty_for_no_show  INTEGER NOT NULL DEFAULT -50,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);