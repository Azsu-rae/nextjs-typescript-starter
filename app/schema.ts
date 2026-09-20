import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['volunteer', 'org', 'admin']);
export const occupationEnum = pgEnum('occupation', [
  'student',
  'employee',
  'teacher',
  'freelancer',
  'housewife',
  'retiree',
  'job_seeker',
  'other',
]);
export const difficultyEnum = pgEnum('difficulty', [
  'beginner',
  'intermediate',
  'advanced',
]);
export const opportunityStatusEnum = pgEnum('opportunity_status', [
  'open',
  'closed',
  'filled',
]);
export const applicationStatusEnum = pgEnum('application_status', [
  'pending',
  'accepted',
  'rejected',
  'completed',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  name: varchar('name', { length: 128 }),
  role: roleEnum('role').default('volunteer').notNull(),
  occupation: occupationEnum('occupation'),
  university: varchar('university', { length: 128 }),
  campus: varchar('campus', { length: 128 }),
  city: varchar('city', { length: 128 }),
  phone: varchar('phone', { length: 32 }),
  availability: varchar('availability', { length: 64 }),
  skills: text('skills').array(),
  languages: text('languages').array(),
  interests: text('interests').array(),
  portfolioUrl: varchar('portfolio_url', { length: 256 }),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  description: text('description'),
  campus: varchar('campus', { length: 128 }),
  verified: boolean('verified').default(false).notNull(),
  logoUrl: text('logo_url'),
  ownerId: integer('owner_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const opportunities = pgTable('opportunities', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id')
    .references(() => organizations.id)
    .notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description').notNull(),
  skills: text('skills').array(),
  effortHours: integer('effort_hours'),
  difficulty: difficultyEnum('difficulty').default('beginner').notNull(),
  campus: varchar('campus', { length: 128 }),
  urgent: boolean('urgent').default(false).notNull(),
  status: opportunityStatusEnum('status').default('open').notNull(),
  deadline: timestamp('deadline'),
  images: text('images').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  status: applicationStatusEnum('status').default('pending').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const volunteerLogs = pgTable('volunteer_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  opportunityId: integer('opportunity_id').references(() => opportunities.id),
  hours: integer('hours').notNull(),
  verified: boolean('verified').default(false).notNull(),
  verifiedBy: integer('verified_by').references(() => users.id),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  opportunityId: integer('opportunity_id').references(() => opportunities.id),
  logId: integer('log_id').references(() => volunteerLogs.id),
  certUid: varchar('cert_uid', { length: 64 }).notNull().unique(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
