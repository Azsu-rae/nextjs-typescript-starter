-- Full profile: occupation + contact + availability + languages/interests
DO $$ BEGIN CREATE TYPE occupation AS ENUM ('student','employee','teacher','freelancer','housewife','retiree','job_seeker','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation occupation;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city varchar(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability varchar(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages text[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests text[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url varchar(256);
