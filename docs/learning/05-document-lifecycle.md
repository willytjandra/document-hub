# Slice 5 — Document Lifecycle

Status: Complete

## Outcome

Extend DocumentHub from simple document storage into a basic document-management workflow.

At the end of this slice, an authenticated user can:

- upload a document;
- view document metadata;
- see the document lifecycle status;
- activate a draft document;
- archive an active document;
- restore an archived document;
- filter documents by status;
- permanently delete an archived document;
- remove both the database record and Storage object.

This slice also introduced database migrations as the standard way of managing Supabase schema changes.

---

## Document lifecycle

Documents now move through:

```text
draft
  ↓
active
  ↓
archived
  ├── restore → active
  └── delete → permanently removed
```

The current statuses are:

```text
draft
active
archived
```

The database prevents arbitrary status values using a check constraint.

---

## What I learned

| Topic                        | Practical outcome                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------- |
| Supabase migrations          | Manage database changes as versioned SQL files instead of dashboard-only changes. |
| Database baselines           | Capture an existing manually created schema before introducing migrations.        |
| Generated database types     | Regenerate TypeScript types after schema changes.                                 |
| PostgreSQL check constraints | Restrict a text column to valid lifecycle values.                                 |
| `timestamptz`                | Store timestamps as absolute points in time and display them locally.             |
| RLS UPDATE policies          | Allow users to update only rows they own.                                         |
| RLS DELETE policies          | Allow users to delete only their own database rows and Storage objects.           |
| `USING` / `WITH CHECK`       | Understand which existing rows can be targeted and what updated rows may contain. |
| Server Actions               | Implement document lifecycle mutations without creating separate API endpoints.   |
| `revalidatePath()`           | Refresh server-rendered pages after mutations.                                    |
| `redirect()`                 | Navigate away after deleting the currently viewed resource.                       |
| URL-driven filtering         | Use `searchParams` and links while keeping the page a Server Component.           |
| Operational documentation    | Record repeatable database procedures in `RUNBOOK.md`.                            |

---

## 1. Introduce Supabase migrations

The database schema was originally created manually through the Supabase dashboard.

The repository was linked to the development project:

```bash
pnpm exec supabase link --project-ref <project-ref>
```

The existing remote schema was then pulled as the migration baseline:

```bash
pnpm exec supabase db pull
```

This baseline represents the point where database schema management moved from manual dashboard changes to version-controlled migrations.

Future schema changes should be implemented through new migration files.

---

## 2. Create migrations

New migrations are created with:

```bash
pnpm exec supabase migration new <migration_name>
```

For example:

```bash
pnpm exec supabase migration new add_document_status
```

Migration files live under:

```text
supabase/
  migrations/
```

They are committed to Git alongside the application changes they support.

---

## 3. Add document status

The `documents` table gained a lifecycle status:

```sql
alter table public.documents
add column status text not null default 'draft';

alter table public.documents
add constraint documents_status_check
check (status in ('draft', 'active', 'archived'));
```

A `text` column plus a check constraint was chosen instead of a PostgreSQL enum.

This keeps database evolution simple while still preventing invalid values.

The generated Supabase TypeScript type remains:

```ts
status: string;
```

If application-level strong typing becomes useful, it can be represented separately:

```ts
type DocumentStatus = "draft" | "active" | "archived";
```

---

## 4. Apply migrations

Pending migrations are reviewed with:

```bash
pnpm exec supabase migration list
```

Then applied to the linked development project:

```bash
pnpm exec supabase db push
```

After applying a schema change, verify the result in Supabase before continuing application development.

---

## 5. Regenerate database types

Schema changes that affect generated TypeScript definitions require:

```bash
pnpm exec supabase gen types typescript --linked > src/types/database.types.ts
```

The exact output path should match the project structure.

Policy-only migrations generally do not change generated database types.

---

## 6. Add `updated_at`

Documents now record when lifecycle state changes:

```sql
alter table public.documents
add column updated_at timestamp with time zone not null default now();
```

The project convention is:

```text
database
  → timestamp with time zone / timestamptz

application
  → UTC ISO timestamps

presentation
  → convert to user's local timezone
```

For example:

```ts
new Date().toISOString();
```

`created_by` and `updated_by` were deliberately not added yet because documents currently have a single owner represented by `user_id`.

Those fields can be introduced when shared editing or audit-history requirements justify them.

---

## 7. Add UPDATE RLS

Users need UPDATE permission to change lifecycle state.

The policy is:

```sql
create policy "Users can update their own documents"
on public.documents
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

The distinction is:

```text
USING
  → which existing rows may be targeted

WITH CHECK
  → what the resulting row is allowed to contain
```

RLS remains the actual authorization boundary.

Application queries also include ownership where convenient:

```ts
.eq("id", documentId)
.eq("user_id", user.id)
```

This makes application intent explicit and provides defence in depth, but does not replace RLS.

---

## 8. Lifecycle Server Actions

Lifecycle changes are implemented as Server Actions.

Examples:

```text
activateDocument()
archiveDocument()
restoreDocument()
deleteDocument()
```

The pattern is:

```text
form submit
   ↓
Server Action
   ↓
authenticate user
   ↓
Supabase update
   ↓
RLS authorization
   ↓
revalidatePath()
   ↓
updated Server Component
```

No separate REST endpoint is needed because these mutations belong only to the Next.js application UI.

---

## 9. Status filtering

The document list supports:

```text
All | Draft | Active | Archived
```

Filtering is URL-driven:

```text
/documents
/documents?status=draft
/documents?status=active
/documents?status=archived
```

The page remains a Server Component.

Conceptually:

```text
click filter link
   ↓
URL changes
   ↓
Server Component receives searchParams
   ↓
Supabase query applies status filter
   ↓
server-rendered result
```

No `useState()` or Client Component is required for this workflow.

---

## 10. Permanent deletion

Permanent deletion is available only from the archived state.

This gives the user an intentional progression:

```text
active
  ↓
archive
  ↓
archived
  ├── restore
  └── delete permanently
```

Delete policies were added to both PostgreSQL metadata and Storage.

Database policy:

```sql
create policy "Users can delete their own documents"
on public.documents
for delete
to authenticated
using (auth.uid() = user_id);
```

Storage policy:

```sql
create policy "Users can delete their own document files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

The Server Action performs:

```text
delete Storage object
   ↓
delete documents row
   ↓
revalidate /documents
   ↓
redirect /documents
```

The current implementation intentionally uses a simple sequential workflow.

A production system with stronger consistency requirements may need additional handling for partial failure between Storage deletion and database deletion.

---

## 11. Database runbook

A root-level:

```text
RUNBOOK.md
```

was introduced to document the operational database workflow.

The normal schema-change workflow is now:

```text
1. Create migration
2. Write SQL
3. Review SQL
4. Check migration history
5. Push to development
6. Verify the database
7. Regenerate database types if required
8. Build the application
9. Test the affected behaviour
10. Commit
```

This process will be extended when staging and production environments are introduced.

---

## Verification

Manual checks:

- [x] Existing documents receive `draft` status after migration.
- [x] Document list displays lifecycle status.
- [x] Document detail page displays lifecycle status.
- [x] Draft document can become active.
- [x] Active document can be archived.
- [x] Archived document can be restored.
- [x] Document list can filter by status.
- [x] Only owned documents can be updated through RLS.
- [x] Archived document can be permanently deleted.
- [x] Permanent deletion removes the Storage object.
- [x] Permanent deletion removes the database record.
- [x] User is redirected to `/documents` after deletion.
- [x] Migration history is managed through Supabase CLI.
- [x] Generated database types were refreshed after schema changes.
- [x] Application continues to build successfully.

Project checks:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

---

## Key takeaways

1. Database schema is application code and should be version controlled.

2. Dashboard-driven database changes are convenient at the beginning, but migrations become important once multiple environments are introduced.

3. RLS is the real database authorization boundary; application filtering does not replace it.

4. Server Components work well for document reads and URL-driven filters.

5. Server Actions are a simple fit for application-owned lifecycle mutations.

6. `revalidatePath()` connects mutations back to server-rendered state.

7. `redirect()` is useful when a mutation removes the resource currently being viewed.

8. Store timestamps as absolute instants and only localise them for display.

9. Add schema fields when product behaviour needs them rather than automatically copying enterprise conventions.

10. Operational processes such as migrations deserve documentation even in a small project.

---

## Milestone commits

Slice 5 was intentionally committed in small checkpoints, including:

```text
chore(db): add baseline migration for existing Supabase schema
feat(db): add document lifecycle status
feat(documents): add document activation flow
feat(documents): add archive and restore actions
feat(documents): add lifecycle status filtering
feat(db): add document delete policies
feat(documents): add permanent document deletion
docs: add database migration runbook
```

Exact commit history may differ slightly from the examples above.

---

## Next milestone

Before continuing to additional product features, deploy the current DocumentHub end to end.

The next milestone is:

**Vercel Deployment — Development → Staging → Production**

Topics will include:

- Vercel project setup;
- environment variables;
- Supabase environment strategy;
- staging and production environments;
- deployment gates;
- database migrations across environments;
- Supabase Auth redirect URLs;
- deployment verification;
- extending `RUNBOOK.md` with environment promotion procedures.

The goal is to finish with a publicly deployed DocumentHub that demonstrates a complete authenticated document-management workflow.
