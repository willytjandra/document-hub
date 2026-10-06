# Slice 2 — Supabase Auth

Status: Complete

## Outcome

Add a complete authentication lifecycle to DocumentHub using Supabase Auth and the Next.js App Router.

At the end of this slice the application supports:

- email/password sign-up;
- email confirmation;
- email/password login;
- logout;
- cookie-based Supabase sessions;
- protected Server Component routes;
- reusable protection through a route-group layout;
- user-friendly auth form states and errors.

## What I learned

| Topic | Practical outcome |
| --- | --- |
| Supabase browser client | Use Supabase from code executing in the browser. |
| Supabase server client | Access Supabase from Server Components, Server Actions, and Route Handlers while sharing auth cookies. |
| `@supabase/ssr` | Make Supabase sessions available to both the browser and Next.js server. |
| Next.js Proxy | Refresh and propagate Supabase auth cookies across requests. |
| Server Actions | Handle application-owned form mutations without building a separate API endpoint. |
| Route Handlers | Handle normal HTTP requests such as callbacks, webhooks, and sign-out endpoints. |
| `getClaims()` | Verify authenticated JWT claims before granting access to protected server-rendered content. |
| Route groups | Protect a group of routes without changing their public URLs. |
| `useActionState` | Return expected form errors from Server Actions without throwing application errors. |
| Email confirmation | Understand the difference between Supabase-hosted verification and an application-controlled token exchange. |

## 1. Dependencies

Install:

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

`@supabase/supabase-js` provides the Supabase API client.

`@supabase/ssr` provides helpers for using Supabase authentication with cookie-based server-side rendering.

## 2. Browser and server Supabase clients

The application uses two client factories:

```text
src/lib/supabase/
├── client.ts
└── server.ts
```

### Browser client

`client.ts` uses `createBrowserClient()`.

Use it in code executing in the browser, normally Client Components.

```ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
```

### Server client

`server.ts` uses `createServerClient()` and Next.js cookies.

Use it in:

- Server Components;
- Server Actions;
- Route Handlers.

The important architectural point is that authentication state is stored in cookies so both browser-side and server-side code can work with the same session.

```text
Browser
   |
   | cookies
   v
Next.js server
   |
   v
Supabase
```

These client helpers are mostly reusable infrastructure. The important thing is to understand which execution environment each one belongs to.

## 3. Session refresh with Proxy

Files:

```text
src/proxy.ts
src/lib/supabase/proxy.ts
```

`src/proxy.ts` is the Next.js Proxy entry point.

The Supabase-specific helper:

1. reads auth cookies from the incoming request;
2. creates a Supabase server client;
3. validates/refreshed auth state;
4. updates cookies on the current request when necessary;
5. writes refreshed cookies to the response.

This allows Server Components later in the same request to see fresh auth state and ensures the browser receives the refreshed cookies for later requests.

The Proxy is session infrastructure. It is not the application's authorization policy.

## 4. Sign-up

Route:

```text
/auth/sign-up
```

The form submits to a Server Action:

```text
form
  -> Server Action
  -> supabase.auth.signUp()
  -> Supabase Auth
```

A Server Action is a good fit because the action originates from our own React UI and does not need to be exposed as an application-designed HTTP API.

After successful registration the application redirects to:

```text
/auth/check-email
```

## 5. Email confirmation

### Current development flow

This project uses Supabase's default confirmation email:

```text
Email
  -> Supabase Auth verification endpoint
  -> Supabase verifies the confirmation
  -> redirect to application Site URL
```

The local Site URL is:

```text
http://localhost:3000
```

### Alternative SSR-friendly flow

A production-oriented SSR flow can instead use a custom confirmation link:

```text
Email
  -> /auth/confirm?token_hash=...&type=email
  -> Next.js Route Handler
  -> supabase.auth.verifyOtp()
  -> session stored in cookies
  -> /dashboard
```

The advantage is that the Next.js server participates directly in exchanging the confirmation token for the authenticated session.

The confirmation Route Handler must be public: the user is not authenticated yet. Security comes from possession of a valid, unexpired confirmation token and from Supabase performing the token validation.

### Constraint encountered

The Supabase Free-plan built-in email configuration used for this project did not allow editing the confirmation template without configuring custom SMTP or using an eligible paid setup.

Because of that, this slice keeps Supabase's default confirmation flow and records the custom `token_hash` flow as a production option.

## 6. Login

Route:

```text
/auth/login
```

Login uses:

```ts
supabase.auth.signInWithPassword({
  email,
  password,
})
```

The form calls a Server Action:

```text
login form
  -> Server Action
  -> signInWithPassword()
  -> auth cookies
  -> /dashboard
```

The server client means the resulting session is available to subsequent server-rendered requests through cookies.

## 7. Protecting routes

Protected routes are grouped under:

```text
src/app/(protected)/
```

For example:

```text
src/app/(protected)/dashboard/page.tsx
```

still maps to:

```text
/dashboard
```

because route-group names in parentheses do not become URL segments.

The layout performs the authentication gate:

```text
request /dashboard
      |
      v
(protected)/layout.tsx
      |
      v
supabase.auth.getClaims()
    /       \
 valid     invalid
  |           |
  v           v
render     /auth/login
```

This avoids repeating authentication checks in every protected page.

## 8. Why `getClaims()` instead of `getSession()`?

When server code makes an authorization decision, it should validate authenticated claims rather than merely trust session information obtained from cookies.

The protected layout therefore uses:

```ts
await supabase.auth.getClaims()
```

and redirects when there is no valid authenticated identity.

The JWT `sub` claim identifies the Supabase user and will later be useful when application tables reference the authenticated user.

## 9. Logout

Logout is implemented as a Route Handler:

```text
POST /auth/signout
```

Flow:

```text
dashboard form
   -> POST /auth/signout
   -> Route Handler
   -> supabase.auth.signOut()
   -> /auth/login
```

This also provided a useful comparison between Server Actions and Route Handlers.

## 10. Server Actions vs Route Handlers

### Server Action

Use when application UI directly invokes server-side work.

Example:

```text
<form action={login}>
```

Conceptually:

```text
React UI
  -> server function
```

Good examples:

- sign-up forms;
- login forms;
- application-owned mutations.

### Route Handler

Use when something needs a normal HTTP endpoint.

Example:

```text
POST /auth/signout
GET /auth/confirm?... 
```

Conceptually:

```text
HTTP request
  -> route.ts
```

Good examples:

- callbacks;
- webhooks;
- APIs;
- redirects;
- externally invoked endpoints.

## 11. Better form error handling

Expected authentication errors should not crash the application.

Instead of:

```ts
throw new Error(error.message)
```

the Server Action returns form state:

```ts
return {
  error: 'Invalid email or password.',
}
```

A small Client Component uses React's `useActionState()` to display the result and expose a pending state:

```text
page.tsx
   -> Server Component

login-form.tsx
   -> Client Component
   -> useActionState()

actions.ts
   -> Server Action
```

This preserves Server Components for the page while keeping only the interactive form on the client.

## 12. Final structure

The authentication-related structure is approximately:

```text
src/
├── app/
│   ├── (protected)/
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   │
│   └── auth/
│       ├── check-email/
│       │   └── page.tsx
│       ├── login/
│       │   ├── actions.ts
│       │   ├── login-form.tsx
│       │   └── page.tsx
│       ├── sign-up/
│       │   ├── actions.ts
│       │   ├── sign-up-form.tsx
│       │   └── page.tsx
│       └── signout/
│           └── route.ts
│
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── proxy.ts
│       └── server.ts
│
└── proxy.ts
```

## 13. Verification

Manual checks:

- [x] New user can sign up.
- [x] User receives a confirmation email.
- [x] User can confirm the account.
- [x] Confirmed user can log in.
- [x] Invalid credentials display an inline error.
- [x] `/dashboard` redirects unauthenticated users to `/auth/login`.
- [x] Authenticated users can access `/dashboard`.
- [x] Logout clears the authenticated session.
- [x] Visiting `/dashboard` after logout redirects to login.

Project checks:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Key takeaways

1. Supabase authentication in a Next.js SSR application is primarily about making session cookies available consistently to both browser and server code.
2. Browser and server Supabase clients solve different execution-environment problems.
3. Proxy handles session maintenance; a protected layout handles the application's authentication boundary.
4. Server Actions are convenient for mutations initiated by the application's React UI.
5. Route Handlers are appropriate when a normal HTTP endpoint is required.
6. Authentication confirms who the user is; later Row Level Security will determine which database records that user is allowed to access.
7. Authentication errors such as bad credentials are expected application states and should be returned to the form rather than thrown as application failures.

## Next slice

Implement document upload using Supabase Storage.

The next slice should introduce:

- a protected upload page;
- storage buckets;
- upload permissions;
- file metadata;
- an initial Row Level Security discussion;
- a clear boundary between file storage and database metadata.
