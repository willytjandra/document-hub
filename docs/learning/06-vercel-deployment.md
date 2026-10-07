# Slice 6 — Vercel Deployment and Production Workflow

Status: Complete

## Outcome

Deploy DocumentHub to Vercel and establish a simple, repeatable release workflow that is appropriate for a small freelance application.

At the end of this slice DocumentHub has:

- a live Vercel production deployment;
- a production Supabase project isolated from local development;
- a staging Supabase project used by local development;
- Vercel-managed production environment variables;
- a production build gate that runs linting, Next.js type generation, TypeScript checking, and the Next.js production build;
- a documented database migration flow from staging to production;
- a lightweight production smoke-test process;
- a clear decision to defer a hosted staging environment until there is a real need for one.

The goal of this slice is not to build enterprise CI/CD. The goal is to understand enough deployment discipline to ship a small client application safely and repeatably.

---

## What I learned

| Topic | Practical outcome |
| --- | --- |
| Vercel deployment | Connect a GitHub repository and deploy a Next.js application. |
| Vercel project root | Understand why a project using `src/` still uses the repository root when `package.json` lives there. |
| Environment variables | Keep environment-specific configuration outside Git and separate local/staging values from production values. |
| Supabase environments | Use separate Supabase projects for local/staging work and production. |
| Supabase Auth URLs | Understand why authentication redirects are environment-specific. |
| Preview deployments | Understand Vercel Preview deployments and why their changing URLs complicate Supabase Auth without a stable staging domain. |
| Database migrations | Promote the same tested migration from staging to production instead of reproducing schema changes manually. |
| Deployment gates | Make Vercel reject a production deployment when lint, type generation, type checking, or build fails. |
| Clean build environments | Recognise that local generated files can hide problems that appear on a clean deployment machine. |
| Production smoke testing | Verify the most important application flow after a deployment. |
| Pragmatic environment design | Avoid adding a hosted staging environment before it solves a real problem. |

---

## 1. Starting point

Before deployment, DocumentHub already supported:

- Supabase authentication;
- protected routes;
- private document upload to Supabase Storage;
- application-level document metadata in PostgreSQL;
- generated Supabase database types;
- Row Level Security for database and Storage access;
- document detail pages;
- document lifecycle states;
- `draft -> active -> archived` transitions;
- restoring archived documents;
- filtering by document status;
- permanent deletion;
- Supabase database migrations;
- a `RUNBOOK.md` for database operations.

The deployment milestone begins only after the application works locally end to end.

---

## 2. Deploy DocumentHub to Vercel

The GitHub repository is connected directly to Vercel.

The repository is public. That is acceptable because application secrets are not committed to Git.

A public repository does not mean production credentials should be public. Configuration that must remain private belongs in environment variables.

The Supabase browser-facing configuration used by this application is:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

The publishable key is intentionally usable by browser applications. Security is enforced through Supabase authentication and Row Level Security.

Secret or privileged Supabase keys must never be exposed using `NEXT_PUBLIC_`.

---

## 3. Vercel project configuration

Vercel detects the application as a Next.js project.

The application source code is under:

```text
src/
```

but the Vercel Root Directory remains:

```text
./
```

because the actual Next.js project root contains files such as:

```text
package.json
pnpm-lock.yaml
next.config.*
tsconfig.json
src/
```

The important distinction is:

```text
Vercel Root Directory
    = directory containing the Next.js project

src/
    = source-code directory inside that project
```

The Root Directory would only change if the Next.js project itself lived inside a subdirectory, for example:

```text
repo/
  apps/
    document-hub/
      package.json
      src/
```

In that case the Vercel Root Directory would be:

```text
apps/document-hub
```

---

## 4. First production deployment

The initial deployment used the existing Supabase project so the first goal was simply to prove that the application could run on Vercel.

The first deployment successfully verified:

- Next.js builds on Vercel;
- environment variables are available to the deployed application;
- Supabase authentication works from the deployed application;
- existing users can log in;
- database reads and writes work;
- document upload works;
- private Storage access works;
- lifecycle operations work;
- restore works;
- permanent deletion works.

This established a deployment baseline before introducing environment separation.

---

## 5. Vercel Production vs Preview deployments

Vercel treats the production branch differently from other Git branches.

For this project:

```text
main
  -> Vercel Production deployment
```

A separate test branch demonstrated Vercel Preview deployments:

```text
test/vercel-preview
  -> Vercel Preview deployment
```

A small visible UI change was pushed to the test branch. The Preview deployment showed the change while the Production deployment did not.

This demonstrated the important model:

```text
branch other than main
    -> Preview deployment

main
    -> Production deployment
```

### Why Preview was not adopted as staging

Each Preview deployment receives a deployment URL, and deployment URLs can change between builds.

This creates extra friction for Supabase Auth redirect configuration because authentication callbacks need trusted URLs.

A stable branch domain or custom staging domain can solve this, but introducing it now would add complexity without improving the learning objective.

The decision for this project is therefore:

> Local development will act as the staging environment for now. A hosted staging environment will be introduced later when a stable domain exists or a real client/release need justifies it.

---

## 6. Final environment model

Two Supabase projects are used.

### Production

```text
document-hub
```

Used by:

```text
Vercel Production
```

### Staging

```text
document-hub-staging
```

Used by:

```text
Local development
```

The resulting environment model is deliberately simple:

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

This gives local development safe separation from production data without introducing another hosted application environment.

---

## 7. Local environment configuration

Local `.env.local` points to the staging Supabase project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<staging-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging-publishable-key>
```

`.env.local` must remain outside Git.

After changing environment variables, restart the development server:

```bash
pnpm dev
```

Environment variables are loaded when the application process starts, so changing `.env.local` while the server is already running does not reliably update the running application.

A separate staging Auth user is required because Supabase Auth users belong to a specific Supabase project.

The production project's users are not automatically copied to staging.

---

## 8. Recreate staging from migrations

The staging Supabase project should not be manually rebuilt table by table.

The repository is linked to the staging project and the existing migration history is applied:

```bash
supabase link --project-ref <staging-project-ref>
supabase db push
```

This recreates the database changes represented by the migration files.

The result should include the DocumentHub application schema and RLS policies represented in migrations.

Storage configuration and Storage policies must also be verified in staging.

The important principle is:

> The migration history should be the reproducible description of database schema changes.

Avoid making a schema change manually in staging and then repeating it manually in production.

---

## 9. Verify staging locally

After pointing local development to `document-hub-staging`, run the application and verify the full flow:

```text
sign up / login
    -> upload document
    -> view document
    -> activate
    -> archive
    -> restore
    -> permanently delete
```

Then verify that test data exists only in:

```text
document-hub-staging
```

and not in:

```text
document-hub
```

This confirms that local development is isolated from production.

---

## 10. Vercel production environment variables

Vercel Production uses the production Supabase project.

The production variables are configured in:

```text
Vercel
  -> Project
  -> Settings
  -> Environment Variables
```

Production values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<production-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<production-publishable-key>
```

These values are configured for the Production environment.

Do not commit real environment values into the repository.

Even though the Supabase publishable key is browser-visible by design, keeping environment configuration in Vercel still avoids hard-coding environment-specific values into source code.

---

## 11. Add a production build gate

A successful local test is not enough to guarantee that a clean production build will succeed.

The project introduces a production build script in `package.json`.

Supporting scripts:

```json
{
  "scripts": {
    "typegen": "next typegen",
    "typecheck": "tsc --noEmit",
    "build:prod": "pnpm lint && pnpm typegen && pnpm typecheck && pnpm build"
  }
}
```

The exact existing `lint` and `build` scripts remain unchanged.

The production gate performs:

```text
ESLint
    -> Next.js type generation
    -> TypeScript typecheck
    -> Next.js production build
```

The same command can be run locally:

```bash
pnpm build:prod
```

---

## 12. Configure Vercel to use the production gate

In Vercel:

```text
Project
  -> Settings
  -> Framework Settings
  -> Build Command
```

set the Build Command to:

```bash
pnpm build:prod
```

The production deployment flow becomes:

```text
push / merge to main
    |
    v
Vercel build starts
    |
    v
pnpm build:prod
    |
    +-> lint
    +-> next typegen
    +-> typecheck
    +-> next build
    |
    v
Deploy only when all checks pass
```

If any command fails, the new deployment fails and does not replace the current successful production deployment.

This gives the project a useful deployment gate without introducing a separate CI platform yet.

---

## 13. Clean build issue: `LayoutProps`

The first version of the production gate used:

```text
lint
    -> tsc --noEmit
    -> build
```

This worked locally but failed on Vercel with:

```text
Cannot find name 'LayoutProps'
```

The application used a Next.js-generated `LayoutProps` type.

Locally, the `.next` directory already contained generated Next.js types because the application had previously been run or built.

Vercel builds from a clean checkout, so those generated types did not yet exist when `tsc --noEmit` ran.

The solution was to explicitly generate the Next.js types before TypeScript validation:

```bash
next typegen
```

The production gate became:

```text
lint
    -> typegen
    -> typecheck
    -> build
```

A useful way to reproduce this kind of clean-environment issue locally is:

```bash
rm -rf .next
pnpm build:prod
```

### Key lesson

> A command working on a development machine does not prove that it works from a clean checkout.

Generated files, caches, and previous builds can hide missing build steps.

---

## 14. Production deployment workflow

The current release process is:

```text
1. Develop locally against document-hub-staging
2. Test the feature locally
3. Apply and verify database migrations in staging when required
4. Run pnpm build:prod locally
5. Commit the verified application and migration changes
6. Apply the tested migration to production when required
7. Push / merge to main
8. Vercel runs pnpm build:prod
9. Vercel deploys only if the gate succeeds
10. Run a production smoke test
```

This workflow is intentionally small enough to understand and operate manually.

---

## 15. Database migration release flow

When a release includes a database change, use the same migration through each environment.

Conceptually:

```text
create migration
    |
    v
apply to staging
    |
    v
test locally
    |
    v
commit migration
    |
    v
apply same migration to production
    |
    v
deploy application
```

The migration is not rewritten for production.

The tested migration file is promoted to production.

A practical sequence is:

```bash
# create the migration during development
supabase migration new <migration-name>

# after linking to staging
supabase db push

# test application locally
pnpm dev

# verify production build
pnpm build:prod
```

Before production deployment, apply the verified migration to the production Supabase project according to the database runbook.

### Why migration order matters

Some application changes depend on a new database column, policy, constraint, or table.

Deploying application code before the required database change may break production.

For the current small application, migration ordering is handled deliberately as part of the release checklist rather than through an automated migration pipeline.

Automation can be introduced later if manual coordination becomes error-prone.

---

## 16. Production smoke test

A successful Vercel build proves that the application compiled. It does not prove that the deployed application can communicate correctly with production services.

After deployment, verify the important user journey:

- [x] Production URL loads.
- [x] Login succeeds.
- [x] `/documents` loads.
- [x] A document can be uploaded.
- [x] The document detail page loads.
- [x] `draft -> active` works.
- [x] `active -> archived` works.
- [x] An archived document can be restored.
- [x] A test document can be permanently deleted.
- [x] The application is using production Supabase data, not staging data.

This is intentionally a short smoke test rather than a complete regression test suite.

---

## 17. Why there is no hosted staging application yet

A common production setup is:

```text
Local
    -> Development backend

Hosted staging
    -> Staging backend

Production
    -> Production backend
```

DocumentHub does not need all three environments yet.

The current setup is:

```text
Local
    -> Supabase staging

Production
    -> Supabase production
```

This is enough to learn environment separation and safe production deployment.

A hosted staging environment would add:

- another stable application URL;
- more Auth redirect configuration;
- more Vercel environment management;
- another release/promotion step;
- more environment-specific debugging.

Those costs become worthwhile when there is a real need, for example:

- a client needs to review changes before production;
- multiple developers need a shared test environment;
- QA needs a stable hosted environment;
- external integrations require a fixed callback URL;
- release approval is required before production;
- the application receives a custom domain and a stable `staging.<domain>` can be created.

Until then, local staging is the more pragmatic choice.

---

## 18. Why GitHub Actions was not introduced

The project already needs Vercel to perform a production build before deployment.

By making Vercel run:

```bash
pnpm build:prod
```

we already get a useful deployment gate.

Adding GitHub Actions now would duplicate much of the same validation without solving another problem.

GitHub Actions may become useful later for things such as:

- pull-request validation before merge;
- automated tests;
- database migration checks;
- scheduled jobs;
- deployment approval workflows;
- separate staging and production promotion;
- security or dependency scanning.

The current rule remains:

> Add automation when it removes a real repeated risk or manual burden, not because a larger system would normally have it.

---

## 19. Final deployment architecture

```text
Developer laptop
    |
    | pnpm dev
    v
Next.js local application
    |
    v
Supabase: document-hub-staging
    |-- Auth
    |-- PostgreSQL
    |-- RLS
    `-- Storage


GitHub main
    |
    | push / merge
    v
Vercel
    |
    | pnpm build:prod
    |   -> lint
    |   -> next typegen
    |   -> typecheck
    |   -> next build
    |
    v
Production Next.js application
    |
    v
Supabase: document-hub
    |-- Auth
    |-- PostgreSQL
    |-- RLS
    `-- Storage
```

This architecture is enough for the current size of DocumentHub and is representative of a practical small-business application deployment.

---

## 20. Operational rules adopted

### Environment rules

```text
Local development
    -> staging Supabase only

Vercel Production
    -> production Supabase only
```

Do not normally point local development at the production Supabase project.

### Secret rules

Never commit:

- `.env.local`;
- database passwords;
- Supabase secret keys;
- legacy `service_role` keys;
- third-party API secrets.

Browser-safe Supabase publishable configuration still belongs in environment variables so different environments can use different projects.

### Database rules

Use migration files for repeatable schema changes.

The normal direction is:

```text
staging
    -> verify
    -> production
```

### Deployment rules

Production must pass:

```text
lint
+ typegen
+ typecheck
+ build
```

before Vercel can deploy the new version.

### Verification rules

After production deployment, run a short application smoke test.

---

## 21. Useful commands

### Local development

```bash
pnpm dev
```

### Production validation

```bash
pnpm build:prod
```

### Simulate a cleaner build locally

```bash
rm -rf .next
pnpm build:prod
```

### Check Supabase projects

```bash
supabase projects list
```

### Link the current repository to a Supabase project

```bash
supabase link --project-ref <project-ref>
```

### Apply pending migrations to the linked project

```bash
supabase db push
```

Always confirm which Supabase project is linked before applying a migration to a remote environment.

---

## 22. Verification

### Deployment

- [x] Public GitHub repository connected to Vercel.
- [x] Vercel detects the Next.js application.
- [x] Repository root is used as the Vercel Root Directory.
- [x] Production environment variables are configured in Vercel.
- [x] Production deployment succeeds.
- [x] Production authentication works.
- [x] Production document operations work end to end.

### Environment separation

- [x] `document-hub` is treated as production.
- [x] `document-hub-staging` exists as the non-production Supabase project.
- [x] Local `.env.local` points to staging.
- [x] Local authentication works against staging.
- [x] Local document operations work against staging.
- [x] Staging test data is isolated from production data.

### Deployment gate

- [x] `typegen` script added.
- [x] `typecheck` script added.
- [x] `build:prod` script added.
- [x] Vercel Build Command uses `pnpm build:prod`.
- [x] Clean-build `LayoutProps` problem identified.
- [x] `next typegen` added before TypeScript validation.
- [x] Production deployment passes the full gate.

### Release process

- [x] Database migrations are tested in staging first.
- [x] Production migration flow is documented.
- [x] Production smoke test is documented.
- [x] Hosted staging is deliberately deferred.

---

## 23. Key takeaways

1. Vercel makes deploying a conventional Next.js application very small operationally: connect the repository, configure environment variables, and provide a repeatable build command.
2. A `src/` directory is not the deployment root. The Next.js project root is the directory containing the project configuration and `package.json`.
3. Environment separation matters as soon as production data exists. Local development should not casually share the production database.
4. Supabase publishable keys are intended for browser use; authorization comes from Auth and RLS, not from hiding the publishable key.
5. Vercel Preview deployments are useful, but a true hosted staging environment is easier to operate with a stable URL.
6. Database migrations are valuable because the same reviewed schema change can move from staging to production.
7. Build gates are most useful when the deployment platform itself runs them and rejects broken production builds.
8. Clean build environments reveal dependencies on generated files and caches that local development can hide.
9. A successful build is not the same as a successful release; a short production smoke test still matters.
10. The right amount of deployment infrastructure depends on the current product. Local staging plus Vercel production is enough for DocumentHub today.

---

## 24. Milestone commits

The deployment milestone was intentionally committed in stages so the learning history remains visible.

Representative commits include:

```text
chore: add production build gate
fix: generate Next.js types before production typecheck
docs: document Vercel deployment workflow
```

The exact commit hashes can be recorded later if needed.

---

## 25. Freelancer perspective

This slice establishes a deployment process that is realistic for a small freelance application.

For a small-business client, the useful capability is not demonstrating a large CI/CD platform. It is being able to say:

```text
I can build the application locally against a safe non-production backend,
manage database changes with migrations,
validate the production build,
deploy it through Vercel,
and verify that the release works.
```

That is enough to ship many small Next.js + Supabase applications responsibly.

The deployment setup can grow later if the client's delivery process requires more environments, approvals, automated tests, or release controls.

---

## Next slice

With authentication, document management, lifecycle operations, migrations, and production deployment now working, the next slice can return to product functionality.

Possible directions include:

- document search;
- tags or categories;
- document sharing;
- organisation/workspace ownership;
- richer metadata editing;
- pagination;
- automated tests around the most important application flows.

The next capability should continue the same approach: add one useful vertical slice, keep abstractions proportional to the problem, and only introduce additional infrastructure when the application actually needs it.
