-- Org profile icons: logo URL with initials fallback in UI
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url varchar(512);
