
# Impetus

Volunteer culture revolution in the Algerian society. Starting with university students. The vision is that of a platform that can connect students, amongst other active members of society, with various charities and volunteering associations and organizations.

All of this is done under the umbrella of a non-profit open source organization that makes software to help Algerian students and the youths in general access knowledge (university, or otherwise) and opportunities in general.

It should be many things:

# Platform features (First Priority)

- **Verified Impact and Certification System:** Volunteering log hours, get shareable digital certificats, to provide verifiable contribution and work
- **smart-matching:** AI-based matching a person with a skillset to a problem. Basically a recommendation system
- **emergency and rapid response mobilization:** AI-based matching a person with a skillset to a problem. Basically a recommendation system
- **Skill-matching over event-browsing when appropriate:** instead of a feed of generic events, orgs post specific problems ("need a translator for a weekend," "need someone to redesign our flyer"), and volunteers get matched by skill rather than availability. Narrower scope, but demos really well because it solves a real friction (for when NGOs don't need bodies, but specific skills).
- **Campus-Chapter Model** instead of a national platform, each university will have a lightweight page for it's own non-profit workers so students can discover what's active on their platform specifically
- **Onboarding/first contribution pipeline:** a small, well-scoped tasks tagged by length of time/difficulty for first contributors with a mentor to guide through it. Such tasks would eventually continually accompany events to keep a steady stream of new-commers.
- **Skill-credit matching** Students can volunteer skills (tutoring, design, translation, dev work) for non-profits in exchange for verified experience on their CV

# A Shared Infrastructure Layer (Eventually, not the priority right now)

- Shared database with an open API for a list of trusted associations and contributors to use
- Open format (CSV, JSON, PDF) of associations and their work for journalists and other orgs to use
- **Community verification as trust badges:** Instead of a central verification authority, a lightweight community reporting/vouching system
- Volunteering records made available through that same API

# Grading Criterias

- Innovation: 25pt
- Relevance to the given problem: 25pt
- Applicapility: 25pt
- Impact on volunteering: 15pt
- Presentation and group work: 10pt

# Next.js + PostgreSQL Auth Starter

This is a [Next.js](https://nextjs.org/) starter kit that uses [NextAuth.js](https://next-auth.js.org/) for simple email + password login, [Drizzle](https://orm.drizzle.team) as the ORM, and a [Neon Postgres](https://vercel.com/postgres) database to persist the data.

## Deploy Your Own

You can clone & deploy it to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-title=Next.js%20Prisma%20PostgreSQL%20Auth%20Starter&demo-description=Simple%20Next.js%2013%20starter%20kit%20that%20uses%20Next-Auth%20for%20auth%20and%20Prisma%20PostgreSQL%20as%20a%20database.&demo-url=https%3A%2F%2Fnextjs-postgres-auth.vercel.app%2F&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F7rsVQ1ZBSiWe9JGO6FUeZZ%2F210cba91036ca912b2770e0bd5d6cc5d%2Fthumbnail.png&project-name=Next.js%%20Prisma%20PostgreSQL%20Auth%20Starter&repository-name=nextjs-postgres-auth-starter&repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnextjs-postgres-auth-starter&from=templates&skippable-integrations=1&env=AUTH_SECRET&envDescription=Generate%20a%20random%20secret%3A&envLink=https://generate-secret.vercel.app/&stores=%5B%7B"type"%3A"postgres"%7D%5D)

## Developing Locally

You can clone & create this repo with the following command

```bash
npx create-next-app nextjs-typescript-starter --example "https://github.com/vercel/nextjs-postgres-auth-starter"
```

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
