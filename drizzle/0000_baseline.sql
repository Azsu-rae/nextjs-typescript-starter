-- Baseline: full schema from scratch (fresh databases, e.g. new Neon project).
-- Idempotent: every statement is IF NOT EXISTS / duplicate_object-safe.
-- Older incremental migrations (0000_rename_*, 0001_*, ...) no-op on top of this.
DO $$ BEGIN CREATE TYPE role AS ENUM ('volunteer','org','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE occupation AS ENUM ('student','employee','teacher','freelancer','housewife','retiree','job_seeker','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE difficulty AS ENUM ('beginner','intermediate','advanced'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE opportunity_status AS ENUM ('open','closed','filled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE application_status AS ENUM ('pending','accepted','rejected','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  password varchar(255),
  name varchar(128),
  role role DEFAULT 'volunteer' NOT NULL,
  occupation occupation,
  university varchar(128),
  campus varchar(128),
  city varchar(128),
  phone varchar(32),
  availability varchar(64),
  skills text[],
  languages text[],
  interests text[],
  portfolio_url varchar(256),
  avatar_url text,
  bio text,
  created_at timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name varchar(128) NOT NULL,
  description text,
  campus varchar(128),
  verified boolean DEFAULT false NOT NULL,
  logo_url text,
  owner_id integer REFERENCES users(id),
  created_at timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  org_id integer NOT NULL REFERENCES organizations(id),
  title varchar(256) NOT NULL,
  description text NOT NULL,
  skills text[],
  effort_hours integer,
  difficulty difficulty DEFAULT 'beginner' NOT NULL,
  campus varchar(128),
  urgent boolean DEFAULT false NOT NULL,
  status opportunity_status DEFAULT 'open' NOT NULL,
  deadline timestamp,
  images text[],
  created_at timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  opportunity_id integer NOT NULL REFERENCES opportunities(id),
  user_id integer NOT NULL REFERENCES users(id),
  status application_status DEFAULT 'pending' NOT NULL,
  message text,
  created_at timestamp DEFAULT NOW() NOT NULL
);
DO $$ BEGIN ALTER TABLE applications ADD CONSTRAINT applications_user_opportunity_unique UNIQUE(user_id, opportunity_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS volunteer_logs (
  id SERIAL PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  opportunity_id integer REFERENCES opportunities(id),
  hours integer NOT NULL,
  verified boolean DEFAULT false NOT NULL,
  verified_by integer REFERENCES users(id),
  note text,
  created_at timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  opportunity_id integer REFERENCES opportunities(id),
  log_id integer REFERENCES volunteer_logs(id),
  cert_uid varchar(64) NOT NULL UNIQUE,
  issued_at timestamp DEFAULT NOW() NOT NULL
);
