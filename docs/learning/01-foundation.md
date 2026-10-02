# Slice 1 — DocumentHub foundation

Status: Planned; update the checklist as work is completed.

Repository: https://github.com/willytjandra/document-hub

## Outcome

Run a basic DocumentHub page locally, understand the Next.js scaffold, and prepare a Supabase development project for the authentication slice.

This is a foundation slice. Authentication, document uploads, database tables, Row Level Security policies, and deployment come later. A running scaffold does not yet demonstrate a production-ready application.

## What I will learn

| Topic | Practical outcome |
| --- | --- |
| Next.js App Router | Explain how `src/app/page.tsx` defines `/` and how `layout.tsx` wraps pages. |
| Server and Client Components | Understand where code executes and when browser interaction requires a Client Component. |
| pnpm | Install dependencies, run scripts, and commit a reproducible lockfile. |
| TypeScript and Tailwind CSS | Read the scaffold and build a small typed, styled page. |
| Supabase | Understand its PostgreSQL, Auth, and Storage capabilities and prepare a development project. |
| Environment configuration | Keep local values out of Git and provide a placeholder configuration for other developers. |
| Verification and Git | Check lint, types, and the production build; record a meaningful milestone. |

## Step 1 — Check the local tools

```bash
node --version
pnpm --version
git --version
```

Use a supported Node.js LTS release that meets the current Next.js requirements. Record the actual Node.js and pnpm versions in the learning notes below. If pnpm is missing, follow the official pnpm installation guide linked at the end.

## Step 2 — Clone the repository

```bash
git clone https://github.com/willytjandra/document-hub.git
cd document-hub
```

If already cloned, use the existing checkout. The following scaffolding command assumes the repository is empty apart from Git metadata. If a README or other files already exist and the CLI reports a conflict, preserve them outside the checkout temporarily and restore them after scaffolding.

## Step 3 — Scaffold Next.js

From the repository root:

```bash
pnpm create next-app@latest . --use-pnpm
```

Select custom settings if the CLI offers a recommended-defaults shortcut:

| Setting | Choice | Reason |
| --- | --- | --- |
| TypeScript | Yes | Type checking across application code. |
| Linter | ESLint | A consistent baseline for code quality. |
| React Compiler | No | Start with fewer concepts; revisit when useful. |
| Tailwind CSS | Yes | Build the initial UI with utility classes. |
| `src/` directory | Yes | Keep application code separate from root configuration. |
| App Router | Yes | Learn the current Next.js application model. |
| Customize import alias | No | Keep the default `@/*` alias. |

Prompts and generated files can change between releases. Inspect what was actually generated rather than assuming every file matches this guide. Commit `pnpm-lock.yaml`; use pnpm consistently.

## Step 4 — Run the default page

```bash
pnpm dev
```

Open http://localhost:3000, or the port printed by the terminal. Confirm the starter page loads. Stop here for the first guided review before changing the scaffold.

## Step 5 — Understand the generated files

| File or directory | Purpose |
| --- | --- |
| `src/app/page.tsx` | The page rendered at `/`. |
| `src/app/layout.tsx` | Root layout, document structure, and shared page wrapper. |
| `src/app/globals.css` | Global styles and Tailwind setup. |
| `public/` | Static assets served by URL. |
| `package.json` | Dependencies and available commands. |
| `pnpm-lock.yaml` | Resolved dependency versions. |
| `tsconfig.json` | TypeScript configuration and import aliases. |
| `next.config.*` | Next.js configuration. |
| `eslint.config.*` | Lint rules. |
| `.gitignore` | Files excluded from Git. |

Read `page.tsx` and `layout.tsx` together. Find where the layout renders `children`, where metadata is defined, and where global CSS is imported.

Key concepts:

- App Router pages and layouts are Server Components by default. Their code is not automatically shipped to the browser, although their rendered output is visible there.
- A Server Component can render during a build or on the server for a request, depending on how the route is configured and what it uses.
- State, event handlers, and browser APIs belong in Client Components. A `'use client'` directive defines that boundary; it does not mean the component can never be prerendered on the server.
- Next.js can provide UI and server-side application logic. We do not need to create a separate Lambda API for every feature.
- Supabase supplies PostgreSQL, authentication, and file storage. Next.js remains responsible for application behaviour and rendering.

Checkpoint: explain these concepts in your own words before moving on.

## Step 6 — Make the first DocumentHub page

Replace the starter content in `src/app/page.tsx` with a small landing page containing:

- The name **DocumentHub**.
- A sentence explaining its purpose: upload, organise, and access documents.
- A clear indication that sign-in and document management are coming in later slices.

Update the page title and description in `src/app/layout.tsx`. Keep this page a Server Component: static content does not need browser state. Do not add buttons that imply working features unless they perform a real action.

Verify that changes appear locally and the page remains readable at a narrow mobile width.

## Step 7 — Prepare Supabase

1. Create a Supabase development project named `document-hub-dev`.
2. Choose an appropriate region for the intended users; record the selected region and reason.
3. Use a strong database password and store it privately.
4. Locate the project URL and **publishable key** in the project settings/connect dialog.
5. Identify the Database, Authentication, and Storage areas in the dashboard.

The publishable key identifies the application; it does not grant unrestricted database access. Later slices must enforce access using authentication and Row Level Security. Secret keys and legacy `service_role` keys must never appear in browser code or public Git history.

We will install and configure the Supabase clients when implementing authentication. Creating the project and setting environment variables alone does not prove that the application is connected.

## Step 8 — Document environment configuration

Create `.env.local` in the repository root with the actual development values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Create `.env.example` with the same names and placeholder values. Add the following exception after the environment-file ignore rule in `.gitignore` if needed:

```gitignore
!.env.example
```

Check the ignore behaviour:

```bash
git check-ignore .env.local
git status --short
```

The first command should report `.env.local`; the status output should show `.env.example` as an untracked or changed file while excluding `.env.local`.

`NEXT_PUBLIC_` values can be included in the browser bundle. This prefix is suitable for the Supabase URL and publishable key, never for secrets. Restart the development server after changing environment variables.

## Step 9 — Verify the foundation

Inspect the generated `package.json` first. If there is no `lint` script, add `"lint": "eslint ."` to its `scripts` object. Use the ESLint CLI rather than assuming `next lint` is available.

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Fix any reported errors. Then run the production server:

```bash
pnpm start
```

Stop `pnpm dev` first if it occupies the same port. Confirm the DocumentHub page loads in production mode. These checks verify the foundation; they do not verify authentication or a Supabase connection.

## Step 10 — Save the milestone

Place this guide at `docs/learning/01-foundation.md`. Update the root README with the application purpose, current implemented scope, local setup commands, and a relative link to this guide:

```markdown
[Slice 1 — Foundation](docs/learning/01-foundation.md)
```

Before committing, review the files and staged diff:

```bash
git status --short
git add .
git diff --cached
git commit -m "chore: bootstrap DocumentHub foundation"
git push
```

Only commit after verifying that the staged changes contain no secrets or unintended files. Keep `.next/`, `node_modules/`, and `.env.local` out of Git.

## Completion checklist

- [ ] Next.js scaffold created using pnpm and the agreed settings.
- [ ] Default page ran locally before modification.
- [ ] App Router, root layout, and component execution boundaries reviewed.
- [ ] Basic DocumentHub page and metadata implemented.
- [ ] Supabase development project created; region choice recorded.
- [ ] `.env.local` ignored and `.env.example` committed with placeholders.
- [ ] Lint, type checking, and production build passed.
- [ ] Production page checked manually.
- [ ] README describes the current scope accurately.
- [ ] Learning notes updated and milestone committed.

## Learning notes — fill in after completing the work

Leave these entries unfinished until the work is verified. This section records actual experience rather than planned achievements.

- Completion date:
- Node.js / pnpm / Next.js versions:
- Supabase region and reason:
- What I can now explain:
- A decision I made and why:
- An issue I encountered and how I resolved it:
- Verification results:
- Milestone commit:

## Next slice

Implement a real sign-in flow with Supabase Auth, browser/server clients, session handling, and a protected page. That slice will demonstrate the first authenticated user journey.

## References

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [create-next-app CLI](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [pnpm installation](https://pnpm.io/installation)
- [Supabase with Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)

This guide was prepared with AI assistance. Implementation decisions, learning notes, and verification results should reflect work I have personally reviewed and completed.
