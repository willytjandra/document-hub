# Database Operations Runbook

This runbook documents how we manage Supabase database schema changes for the Document Hub project.

The goal is to keep database changes repeatable, reviewable, and safe without introducing unnecessary process.

---

## Principles

- All schema changes should be made through Supabase migrations.
- Avoid making schema changes manually in the Supabase dashboard.
- Migration files should be committed to Git.
- Database types should be regenerated after schema changes that affect generated types.
- The application should still build and run before committing a migration.
- Apply the same migrations consistently across environments.

---

## Creating a New Migration

Create a migration from the project root:

```bash
pnpm exec supabase migration new <migration_name>
```

Example:

```bash
pnpm exec supabase migration new add_document_status
```

This creates a timestamped SQL file under:

```text
supabase/migrations/
```

Example:

```text
supabase/migrations/20261006153000_add_document_status.sql
```

Add the required SQL changes to this migration file.

Example:

```sql
alter table public.documents
add column status text not null default 'draft';

alter table public.documents
add constraint documents_status_check
check (status in ('draft', 'active', 'archived'));
```

---

## Review the Migration

Before applying the migration:

- read the generated SQL
- confirm the migration only contains the intended schema changes
- check for destructive operations such as `drop table`, `drop column`, or unexpected permission changes
- check RLS policies carefully when changing access rules

To see migration state:

```bash
pnpm exec supabase migration list
```

Confirm that the new migration exists locally but has not yet been applied remotely.

---

## Apply the Migration to Development

Apply pending migrations to the linked Supabase development project:

```bash
pnpm exec supabase db push
```

Review the migrations shown by the CLI before confirming.

After the migration succeeds, verify the change in the Supabase dashboard.

Examples:

- confirm a new column exists
- confirm the expected default value
- confirm constraints exist
- confirm RLS policies exist

---

## Regenerate Supabase Database Types

If the schema change affects tables, columns, relationships, enums, or other generated database types, regenerate the TypeScript definitions.

Example:

```bash
pnpm exec supabase gen types typescript --linked > src/types/database.types.ts
```

Use the actual path to the generated database types file if it differs.

Policy-only migrations generally do not require regenerated TypeScript types.

---

## Validate the Application

After applying a migration, run:

```bash
pnpm build
```

Also manually test the relevant application flow.

For example, after changing the `documents` table:

```text
upload document
→ list documents
→ open document
→ update lifecycle state
→ verify expected database behaviour
```

Do not continue with additional feature work until the application still works with the new schema.

---

## Commit the Migration

Commit the migration after:

- the migration has been applied successfully
- the schema has been verified
- generated types have been refreshed when required
- the application builds successfully
- the relevant behaviour has been tested

Prefer keeping schema changes in a clear commit.

Examples:

```text
feat(db): add document lifecycle status
```

```text
feat(db): add document delete policies
```

For infrastructure-only setup:

```text
chore(db): add baseline migration for existing Supabase schema
```

---

## Standard Schema Change Workflow

Use this sequence for normal database changes:

```text
1. Create migration
2. Write migration SQL
3. Review migration
4. Check migration list
5. Push migration to development
6. Verify database schema
7. Regenerate database types if required
8. Build the application
9. Test affected functionality
10. Commit the migration and related type changes
11. Continue application development
```

---

## Row Level Security Changes

Supabase uses PostgreSQL privileges together with Row Level Security.

A table-level `GRANT` does not automatically mean a user can access every row.

RLS policies determine which rows authenticated or anonymous users are allowed to access.

When adding a mutation such as:

```text
INSERT
UPDATE
DELETE
```

check whether the corresponding RLS policy exists.

Example UPDATE policy:

```sql
create policy "Users can update their own documents"
on public.documents
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Example DELETE policy:

```sql
create policy "Users can delete their own documents"
on public.documents
for delete
to authenticated
using (auth.uid() = user_id);
```

Treat RLS as the main database authorization boundary.

Application queries may also filter by ownership for clarity and defence in depth.

Example:

```ts
.eq("id", documentId)
.eq("user_id", user.id)
```

---

## Timestamp Convention

Store application timestamps as absolute points in time using PostgreSQL:

```sql
timestamp with time zone
```

or:

```sql
timestamptz
```

Example:

```sql
updated_at timestamp with time zone not null default now()
```

Application-generated timestamps should use UTC ISO format:

```ts
new Date().toISOString();
```

Convert timestamps to the user's local timezone only when displaying them.

---

## Existing Database Baseline

This project originally created its schema manually through the Supabase dashboard.

Migration management was introduced later.

The existing schema was captured using:

```bash
pnpm exec supabase db pull
```

The generated migration represents the baseline state of the database at the point where migration management was introduced.

Do not rewrite the baseline migration unless there is a specific reason to do so.

Future schema changes should use new migration files.

---

## Linking a Supabase Project

To check available projects:

```bash
pnpm exec supabase projects list
```

To link the local project:

```bash
pnpm exec supabase link --project-ref <project-ref>
```

To verify migration history:

```bash
pnpm exec supabase migration list
```

Avoid committing database passwords or sensitive credentials to Git.

---

## Production Safety

Before applying database changes to production:

- ensure the migration has already been tested in development
- apply it to staging first once staging is available
- verify the deployed application against the staging database
- review destructive SQL carefully
- ensure application code is compatible with the target schema
- avoid making manual production schema changes outside migrations

The production deployment workflow will be documented further once staging and production environments are introduced.

---

## Future Automation

The current workflow intentionally keeps migration creation and review manual.

Potential automation later:

```text
Git push
→ CI build
→ apply migrations to staging
→ deploy staging
→ verify
→ manual production approval
→ apply migrations to production
→ deploy production
```

Migration creation and SQL review should remain explicit developer actions even if execution becomes automated.

For this project, prefer a simple and understandable deployment process over complex infrastructure.
