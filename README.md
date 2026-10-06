# DocumentHub

A document management application built with Next.js and Supabase.

I'm building DocumentHub to learn this stack through a practical application: signing in, uploading documents, and managing access to them. My background is in React, backend services, and AWS; this project explores how those skills translate to Next.js and Supabase.

The project is developed in small slices. Each slice adds a focused capability and records the decisions, problems encountered, and verification results.

## Current status

DocumentHub has completed five learning slices:

- **Slice 1 — Foundation:** Next.js App Router scaffold, project structure, local setup, and Supabase project preparation.
- **Slice 2 — Supabase Auth:** sign-up, email confirmation, login, logout, cookie-based sessions, protected routes, Server Actions, and Route Handlers.
- **Slice 3 — Document Upload with Supabase Storage:** private document uploads, Storage Row Level Security, server-side validation, revalidation, and signed access to private files.
- **Slice 4 — Document Metadata:** application-level document metadata in PostgreSQL, document list and detail pages, database RLS, and Storage-backed signed document access.
- **Slice 5 — Document Lifecycle:** document status, activate/archive/restore flows, status filtering, permanent deletion, database migrations, generated database types, and operational migration documentation.

The application now supports an authenticated user uploading PDF or image documents to private Supabase Storage, storing application metadata in PostgreSQL, viewing document details, managing a document lifecycle, filtering documents by status, and securely deleting archived documents.

Database schema changes are now managed through version-controlled Supabase migrations and documented in [`RUNBOOK.md`](RUNBOOK.md).

## Stack

| Technology              | Role                                                                      |
| ----------------------- | ------------------------------------------------------------------------- |
| Next.js with App Router | Application UI and server-side logic                                      |
| React and TypeScript    | Components and typed application code                                     |
| Tailwind CSS            | Styling                                                                   |
| Supabase                | PostgreSQL database, authentication, Row Level Security, and file storage |
| `@supabase/ssr`         | Cookie-aware Supabase clients for browser and server execution            |
| pnpm                    | Dependency management and project commands                                |
| ESLint                  | Code linting                                                              |

## Implemented architecture

```text
Browser
   |
   | authenticated request / form submission
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

DocumentHub now separates the application record from the physical file:

```text
PostgreSQL
  -> document ID
  -> user ID
  -> original filename
  -> Storage path
  -> MIME type
  -> size
  -> created timestamp

Supabase Storage
  -> actual uploaded file
```

PostgreSQL is the application source of truth for documents, while Supabase Storage remains responsible for storing the underlying file objects.

## Run locally

### Prerequisites

- A supported Node.js LTS release compatible with the project's Next.js version.
- pnpm.
- A Supabase development project.

### Setup

```bash
git clone https://github.com/willytjandra/document-hub.git
cd document-hub
pnpm install
cp .env.example .env.local
```

Set the development values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use the project URL and publishable key from your Supabase project. Keep `.env.local` out of Git. Never put a Supabase secret key or legacy `service_role` key in a `NEXT_PUBLIC_` variable.

Start the development server:

```bash
pnpm dev
```

Open [localhost:3000](http://localhost:3000), or the port shown in the terminal.

## Verification

Run the project checks after each slice:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Feature-specific manual checks are recorded in each learning guide.

## Learning history

| Slice                                                                             | Focus                                                                                        | Status   |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| [01 — Foundation](docs/learning/01-foundation.md)                                 | Next.js scaffold, application structure, initial page, and Supabase preparation              | Complete |
| [02 — Supabase Auth](docs/learning/02-supabase-auth.md)                           | Authentication lifecycle, SSR sessions, protected routes, Server Actions, and Route Handlers | Complete |
| [03 — Document Upload with Supabase Storage](docs/learning/03-document-upload.md) | Private Storage, RLS, upload validation, revalidation, and signed URLs                       | Complete |
| [04 — Document Metadata](docs/learning/04-document-metadata.md)                   | PostgreSQL document metadata, RLS, document list/detail pages, and signed document access    | Complete |
| [05 — Document Lifecycle](docs/learning/05-document-lifecycle.md)                 | Lifecycle state, mutations, filtering, deletion, migrations, and database operations         | Complete |

The next milestone is **Vercel Deployment — Staging → Production**.

The objective is to deploy the complete DocumentHub built through Slices 1–5, introduce environment promotion and deployment gates, and extend the database runbook for staging and production operations.

Each learning record documents not only what was built, but also the architectural trade-offs and concepts learned along the way.
