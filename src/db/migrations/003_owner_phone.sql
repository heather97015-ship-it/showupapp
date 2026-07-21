-- Migration 003: Add owner_phone to owner_settings for SMS alerts
ALTER TABLE owner_settings ADD COLUMN IF NOT EXISTS owner_phone TEXT;
