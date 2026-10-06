# DocumentHub

A document management application built with Next.js and Supabase.

I'm building DocumentHub to learn this stack through a practical application: signing in, uploading documents, and managing access to them. My background is in React, backend services, and AWS; this project explores how those skills translate to Next.js and Supabase.

The project is developed in small vertical slices. Each slice adds a focused capability and records the decisions, problems encountered, and verification results.

## Current status

**Slice 2 — Supabase Auth** is complete.

The application now supports:

- Email/password sign-up with Supabase Auth.
- Email confirmation using Supabase's default confirmation flow.
- Email/password login.
- Logout.
- Cookie-based Supabase sessions for Next.js SSR.
- Protected routes using a route-group layout.
- User-friendly authentication form states and errors.

The next slice will build on the authenticated application and introduce document upload.

## Stack

| Technology              | Role                                                  |
| ----------------------- | ----------------------------------------------------- |
| Next.js with App Router | Application UI and server-side logic                  |
| React and TypeScript    | Components and typed application code                 |
| Tailwind CSS            | Styling                                               |
| Supabase                | PostgreSQL database, authentication, and file storage |
| `@supabase/supabase-js` | Supabase JavaScript client                            |
| `@supabase/ssr`         | Cookie-based Supabase session handling for SSR        |
| pnpm                    | Dependency management and project commands            |
| ESLint                  | Code linting                                          |

## Authentication architecture

DocumentHub uses separate Supabase clients for browser and server execution.

```text
Browser
   |
   | auth cookies
   v
Next.js
   |
   +-- Client Components
   |      -> browser Supabase client
   |
   +-- Server Components / Actions / Route Handlers
          -> server Supabase client
                    |
                    v
                 Supabase
```

The Next.js proxy keeps Supabase authentication cookies refreshed. Protected application routes live under the `(protected)` route group, whose layout verifies the authenticated user's claims before rendering protected content.

The route group is an organisational boundary only. For example:

```text
src/app/(protected)/dashboard/page.tsx
```

is still available at:

```text
/dashboard
```

## Authentication flow

### Sign-up

```text
/auth/sign-up
    -> Server Action
    -> supabase.auth.signUp()
    -> /auth/check-email
```

Supabase's default email confirmation flow is currently used for this learning project.

### Login

```text
/auth/login
    -> Server Action
    -> supabase.auth.signInWithPassword()
    -> /dashboard
```

### Protected routes

```text
/dashboard
    -> (protected)/layout.tsx
    -> supabase.auth.getClaims()
    -> render or redirect to /auth/login
```

### Logout

```text
POST /auth/signout
    -> Route Handler
    -> supabase.auth.signOut()
    -> /auth/login
```

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

Use the project URL and publishable key from your Supabase project.

Keep `.env.local` out of Git. Never put a Supabase secret key or legacy `service_role` key in a `NEXT_PUBLIC_` variable.

In the Supabase dashboard, set the Authentication Site URL for local development to:

```text
http://localhost:3000
```

Start the application:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

Useful authentication routes:

```text
/auth/sign-up
/auth/login
/dashboard
```

## Verification

Run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

For Slice 2, also manually verify:

1. A new user can sign up.
2. The confirmation email is received and the account can be confirmed.
3. A confirmed user can log in.
4. An unauthenticated request to `/dashboard` redirects to `/auth/login`.
5. An authenticated user can access `/dashboard`.
6. Logout removes the authenticated session.
7. Invalid login details display a form error instead of an application error.

## Supabase email confirmation note

This project currently uses Supabase's default confirmation-email flow.

For an SSR-oriented production application, a useful alternative is to customise the confirmation email so it links to an application Route Handler such as:

```text
/auth/confirm?token_hash=...&type=email
```

The application can then call `supabase.auth.verifyOtp()` server-side and establish the session through cookies before redirecting the user.

The Supabase Free-plan email configuration used during this slice did not allow editing the built-in email template without configuring custom SMTP or moving to an eligible paid setup, so the custom token-hash flow is intentionally deferred.

## Learning history

| Slice                                                   | Focus                                                                                                    | Status   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| [01 — Foundation](docs/learning/01-foundation.md)       | Next.js scaffold, application structure, initial page, and Supabase preparation                          | Complete |
| [02 — Supabase Auth](docs/learning/02-supabase-auth.md) | SSR clients, sessions, sign-up, email confirmation, login, logout, protected routes, and auth form state | Complete |

The next slice will introduce document upload and begin using Supabase Storage.

Each learning record captures both the implementation and the reasoning behind the architecture.
