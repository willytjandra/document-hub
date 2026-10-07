# DocumentHub

A document management application built with Next.js and Supabase.

I'm building DocumentHub to learn this stack through a practical application: signing in, uploading documents, managing document metadata and lifecycle, and deploying a working application to production. My background is in React, backend services, and AWS; this project explores how those skills translate to a pragmatic Next.js and Supabase stack suitable for small client applications.

The project is developed in small vertical slices. Each slice adds a focused capability and records the decisions, problems encountered, and verification results.

## Current status

DocumentHub has completed six learning slices and is deployed to Vercel.

- **Slice 1 — Foundation:** Next.js App Router scaffold, project structure, local setup, and Supabase preparation.
- **Slice 2 — Supabase Auth:** sign-up, email confirmation, login, logout, cookie-based sessions, protected routes, Server Actions, and Route Handlers.
- **Slice 3 — Document Upload with Supabase Storage:** private document uploads, Storage RLS, server-side validation, listing, revalidation, and signed file access.
- **Slice 4 — Document Metadata:** PostgreSQL document metadata, generated Supabase database types, database RLS, document listing, and document detail pages.
- **Slice 5 — Document Lifecycle:** draft → active → archived lifecycle, filtering, restore, permanent deletion, database migrations, and operational runbook.
- **Slice 6 — Vercel Deployment and Production Workflow:** Vercel deployment, staging/production Supabase separation, environment variables, production build gate, migration promotion, and smoke testing.

The application currently supports:

- authenticated users;
- private PDF and image uploads;
- PostgreSQL-backed document metadata;
- document detail pages;
- draft, active, and archived states;
- filtering by lifecycle state;
- restoring archived documents;
- permanent deletion of metadata and stored files;
- Row Level Security for database and Storage access;
- version-controlled Supabase database migrations;
- separate staging and production Supabase projects;
- Vercel production deployment with a build gate.

Database schema changes are managed through version-controlled Supabase migrations and operational procedures are documented in [`RUNBOOK.md`](RUNBOOK.md).

**Live application:** https://document-hub-two.vercel.app/

## Stack

| Technology              | Role                                                                      |
| ----------------------- | ------------------------------------------------------------------------- |
| Next.js with App Router | Application UI and server-side logic                                      |
| React and TypeScript    | Components and typed application code                                     |
| Tailwind CSS            | Styling                                                                   |
| Supabase                | PostgreSQL database, authentication, Row Level Security, and file storage |
| `@supabase/ssr`         | Cookie-aware Supabase clients for browser and server execution            |
| Vercel                  | Production hosting and deployment                                         |
| pnpm                    | Dependency management and project commands                                |
| ESLint                  | Code linting                                                              |

## Implemented architecture

```text
Browser
   |
   | authenticated request / form submission
   v
Vercel
   |
   v
Next.js App Router
   |
   |-- Server Components -> read application data
   |-- Server Actions ----> application-owned mutations
   |-- Route Handlers ----> explicit HTTP endpoints
   |
   v
Supabase
   |
   |-- Auth
   |
   |-- PostgreSQL
   |    `-- public.documents
   |         `-- document metadata + ownership
   |
   |-- Storage
   |    `-- private documents bucket
   |         `-- <user-id>/<uuid>-<filename>
   |
   `-- Row Level Security
        |-- database document ownership
        `-- Storage object ownership
```

DocumentHub separates the application record from the physical file:

```text
PostgreSQL
 -> document ID
 -> user ID
 -> original filename
 -> Storage path
 -> MIME type
 -> size
 -> lifecycle status
 -> created / updated timestamps

Supabase Storage
 -> actual uploaded file
```

PostgreSQL is the application source of truth for documents, while Supabase Storage remains responsible for storing the underlying file objects.

## Environments

DocumentHub currently uses a deliberately simple two-environment model:

```text
Local development
    |
    v
Supabase: document-hub-staging

main branch
    |
    v
Vercel Production
    |
    v
Supabase: document-hub
```

Local development uses `document-hub-staging`, so schema, RLS, Storage, authentication, and application changes can be tested without modifying production data.

Vercel Preview deployments were explored during Slice 6 but are not used as a formal staging environment. A hosted staging environment is intentionally deferred until there is a stable domain and a real need for it.

## Run locally

### Prerequisites

- A supported Node.js LTS release compatible with the project's Next.js version.
- pnpm.
- Access to a Supabase project for local/staging development.

### Setup

```bash
git clone https://github.com/willytjandra/document-hub.git
cd document-hub
pnpm install
cp .env.example .env.local
```

Set the local staging values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-staging-publishable-key
```

Use the project URL and publishable key from the staging Supabase project. Keep `.env.local` out of Git. Never put a Supabase secret key or legacy `service_role` key in a `NEXT_PUBLIC_` variable.

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), or the port shown in the terminal.

## Database migrations

Database schema changes are represented as Supabase migration files rather than being reproduced manually in each environment.

The normal migration flow is:

```text
create migration locally
    ↓
apply to document-hub-staging
    ↓
test application locally
    ↓
apply the same migration to document-hub production
    ↓
deploy application
```

See [`RUNBOOK.md`](RUNBOOK.md) for the operational commands and checks used for database changes.

## Production deployment

The GitHub repository is connected directly to Vercel.

```text
push / merge to main
    ↓
Vercel Production deployment
    ↓
pnpm build:prod
    ↓
deploy only if validation succeeds
```

Production environment variables in Vercel point to the `document-hub` Supabase project. Local `.env.local` points to `document-hub-staging`.

After a successful release, the main application flow is smoke tested in production.

## Verification

Run the same production validation locally before pushing to `main`:

```bash
pnpm build:prod
```

The production build gate runs:

```text
ESLint
  ↓
Next.js type generation
  ↓
TypeScript typecheck
  ↓
Next.js production build
```

Vercel uses the same `build:prod` command. If any step fails, the new production deployment fails and the previous successful deployment remains live.

Feature-specific manual checks are recorded in each learning guide.

## Learning history

| Slice                                                                                   | Focus                                                                                                       | Status   |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| [01 — Foundation](docs/learning/01-foundation.md)                                       | Next.js scaffold, application structure, initial page, and Supabase preparation                             | Complete |
| [02 — Supabase Auth](docs/learning/02-supabase-auth.md)                                 | Authentication lifecycle, SSR sessions, protected routes, Server Actions, and Route Handlers                | Complete |
| [03 — Document Upload with Supabase Storage](docs/learning/03-document-upload.md)       | Private Storage, RLS, upload validation, revalidation, and signed URLs                                      | Complete |
| [04 — Document Metadata](docs/learning/04-document-metadata.md)                         | PostgreSQL document metadata, RLS, document list/detail pages, and signed document access                   | Complete |
| [05 — Document Lifecycle](docs/learning/05-document-lifecycle.md)                       | Lifecycle state, mutations, filtering, deletion, migrations, and database operations                        | Complete |
| [06 — Vercel Deployment and Production Workflow](docs/learning/06-vercel-deployment.md) | Environment separation, Vercel deployment, production build gate, migration promotion, and release workflow | Complete |

With authentication, document management, lifecycle operations, migrations, environment separation, and production deployment now working, the next slice can return to product functionality.

Possible future directions include document search, tags/categories, richer metadata editing, sharing, organisation/workspace ownership, pagination, or automated tests. The next capability should continue the same philosophy: add one useful vertical slice, keep abstractions proportional to the problem, and introduce additional infrastructure only when it solves a real need.

Each learning record documents not only what was built, but also the architectural trade-offs and concepts learned along the way.
