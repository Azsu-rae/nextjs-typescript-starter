-- MVP core migration: rename legacy "User" -> users, widen types.
-- New tables (organizations, opportunities, etc.) are created by `npm run db:push`.
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User'
  ) AND NOT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'
  ) THEN
    ALTER TABLE "User" RENAME TO users;
  END IF;
END $$;

ALTER SEQUENCE IF EXISTS "User_id_seq" RENAME TO users_id_seq;
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    BEGIN
      ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- Widen legacy varchar(64) so bcrypt hashes + emails fit
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    BEGIN ALTER TABLE users ALTER COLUMN email TYPE varchar(255); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE users ALTER COLUMN password TYPE varchar(255); EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
