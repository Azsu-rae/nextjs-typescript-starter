-- Schedule feature: deadlines on tasks
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS deadline timestamp;

-- Backfill existing seeded rows so the feed/schedule has something to show
UPDATE opportunities SET deadline = NOW() + INTERVAL '7 days' WHERE deadline IS NULL AND title ILIKE '%flyer%';
UPDATE opportunities SET deadline = NOW() + INTERVAL '10 days' WHERE deadline IS NULL AND title ILIKE '%poster%';
UPDATE opportunities SET deadline = NOW() + INTERVAL '14 days' WHERE deadline IS NULL AND title ILIKE '%tutoring%';
UPDATE opportunities SET deadline = NOW() + INTERVAL '21 days' WHERE deadline IS NULL AND title ILIKE '%contact form%';
UPDATE opportunities SET deadline = NOW() + INTERVAL '14 days' WHERE deadline IS NULL;
