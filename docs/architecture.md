# DocumentHub architecture

This document describes the current application design for developers who want to
understand or extend DocumentHub. It complements the [learning journey](learning/)
and the [database operations runbook](../RUNBOOK.md).

## Application overview

DocumentHub uses Next.js as the application layer and Supabase for authentication,
PostgreSQL, private file storage, and Row Level Security.

```text
Browser
   |
   | authenticated requests and form submissions
   v
Vercel / Next.js
   |-- Server Components  -> read application data
   |-- Server Actions     -> application-owned mutations
   |-- Route Handlers     -> explicit HTTP endpoints
   |
   v
Supabase
   |-- Auth
   |-- PostgreSQL
   |     `-- public.documents
   |-- Storage
   |     `-- private documents bucket
   `-- Row Level Security
```

The application does not use a separate backend service. Next.js handles rendering
and application logic, while Supabase provides the managed data and authentication
services.

## User-facing routes

```text
/                         Public product introduction
/auth/login               Sign in
/auth/sign-up             Create an account
/auth/check-email         Email confirmation guidance
/auth/error               Authentication error recovery
/documents                Authenticated document workspace
/documents?status=draft   Filtered document workspace
/documents/:id            Document details and lifecycle actions
/auth/signout             Logout endpoint
```

The `(protected)` route group applies authentication without changing the public URL
of the protected pages. After signing in, users go directly to `/documents`.

## Document data model

DocumentHub separates the application record from the physical file:

```text
PostgreSQL
  -> document ID
  -> user ID
  -> original filename
  -> Storage path
  -> MIME type
  -> file size
  -> lifecycle status
  -> created / updated timestamps

Supabase Storage
  -> actual uploaded file
```

The `public.documents` table is the application source of truth for document
metadata. The underlying file is stored in a private `documents` Storage bucket using
an ownership-aware path:

```text
<user-id>/<uuid>-<original-filename>
```

Documents currently move through this lifecycle:

```text
draft
  ↓
active
  ↓
archived
  ├── restore → active
  └── delete  → permanently removed
```

## Authentication and authorization

- Supabase Auth manages email/password accounts and sessions.
- `@supabase/ssr` provides cookie-aware browser and server clients.
- The protected layout verifies authenticated claims before rendering the application
  shell.
- Server Actions authenticate and validate requests again at the mutation boundary.
- PostgreSQL Row Level Security restricts document rows to their owner.
- Storage policies restrict objects to the authenticated user's folder.
- Files are opened through short-lived signed URLs rather than public URLs.

The publishable Supabase key is safe to use in browser configuration because access
control is enforced by authentication and Row Level Security. Secret or privileged
keys must never be exposed through `NEXT_PUBLIC_` environment variables.

## Environments

The project uses separate Supabase projects for local development and production:

```text
Local development
    |
    v
Supabase staging project

main branch
    |
    v
Vercel production
    |
    v
Supabase production project
```

Local development should use staging values from `.env.local`. Production values are
configured in Vercel and are not committed to the repository.

Hosted staging and preview deployments are intentionally not treated as a formal
environment. They can be introduced later if a stable domain and a real testing need
justify them.

## Database and deployment workflow

Schema changes are represented by version-controlled Supabase migrations:

```text
create migration
    ↓
apply to staging
    ↓
test locally
    ↓
apply the same migration to production
    ↓
deploy application
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

See [`RUNBOOK.md`](../RUNBOOK.md) for the commands and checks used when changing the
database schema.
