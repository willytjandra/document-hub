# DocumentHub

A document management application built with Next.js and Supabase.

I'm building DocumentHub to learn this stack through a practical application: signing in, uploading documents, and managing access to them. My background is in React, backend services, and AWS; this project explores how those skills translate to Next.js and Supabase.

The project is developed in small slices. Each slice adds a focused capability and records the decisions, problems encountered, and verification results.

## Current status

The project is starting with **Slice 1 — Foundation**: scaffolding Next.js, understanding the App Router, building the initial page, and preparing a Supabase development project.

Authentication, document uploads, and document management are planned. They are not yet documented here as completed features.

## Stack

| Technology | Role |
| --- | --- |
| Next.js with App Router | Application UI and server-side logic |
| React and TypeScript | Components and typed application code |
| Tailwind CSS | Styling |
| Supabase | PostgreSQL database, authentication, and file storage |
| pnpm | Dependency management and project commands |
| ESLint | Code linting |

## Run locally

These instructions apply once the Next.js scaffold from Slice 1 has been committed. Before then, follow the [foundation guide](docs/learning/01-foundation.md).

### Prerequisites

- A supported Node.js LTS release compatible with the project's Next.js version.
- pnpm.
- A Supabase development project for the Supabase configuration steps and subsequent features.

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

The initial static page does not require a working Supabase connection. Preparing environment values is groundwork for the later authentication slice.

## Verification

After completing the foundation setup, run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

The foundation guide includes adding `"lint": "eslint ."` if the scaffold does not provide a lint script.

To check the production build locally, stop the development server and run:

```bash
pnpm start
```

These checks cover linting, types, and the application build. Feature-specific verification will be added as the application grows.

## Learning history

| Slice | Focus | Status |
| --- | --- | --- |
| [01 — Foundation](docs/learning/01-foundation.md) | Next.js scaffold, application structure, initial page, and Supabase preparation | Planned |

The next slice will introduce Supabase authentication and a protected page. Later work will cover document uploads, metadata, and access policies.

Each learning record separates planned work from completed results. As slices are completed, this README will be updated with working features, screenshots, and a demo link.
