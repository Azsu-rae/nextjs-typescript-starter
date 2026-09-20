-- Profile pictures: data-URL avatars (client-resized, no object storage needed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE organizations ALTER COLUMN logo_url TYPE text;
