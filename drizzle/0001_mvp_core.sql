-- MVP core: enums + new columns on users + new tables
DO $$ BEGIN CREATE TYPE role AS ENUM ('volunteer','org','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE difficulty AS ENUM ('beginner','intermediate','advanced'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE opportunity_status AS ENUM ('open','closed','filled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE application_status AS ENUM ('pending','accepted','rejected','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role role DEFAULT 'volunteer' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS university varchar(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS campus varchar(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW() NOT NULL;
DO $$ BEGIN ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE(email); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name varchar(128) NOT NULL,
  description text,
  campus varchar(128),
  verified boolean DEFAULT false NOT NULL,
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
DO $$ BEGIN ALTER TABLE applications ADD CONSTRAINT applications_user_opportunity_unique UNIQUE(user_id, opportunity_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
