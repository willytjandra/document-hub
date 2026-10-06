# Slice 4 — Document Metadata with Supabase Postgres

Status: Complete

## Outcome

Move DocumentHub from a Storage-only document model to an application-level document model backed by Supabase PostgreSQL.

At the end of this slice the application supports:

- storing document metadata in `public.documents`;
- associating each document with an authenticated user;
- database Row Level Security for document ownership;
- saving metadata after a successful Storage upload;
- cleaning up the Storage object if metadata persistence fails;
- generated TypeScript types from the Supabase database schema;
- querying documents from PostgreSQL rather than listing Storage objects;
- dynamic document detail routes;
- short-lived signed URLs generated from the stored Storage path;
- basic responsive styling using Tailwind CSS.

## What I learned

| Topic | Practical outcome |
| --- | --- |
| PostgreSQL schemas | Understand that `public.documents` means the `documents` table inside the `public` schema. |
| Application metadata | Separate the application document record from the physical Storage object. |
| Database RLS | Restrict database rows based on the authenticated user's ID. |
| `USING` | Control which existing rows a user can read. |
| `WITH CHECK` | Control which rows a user is allowed to create. |
| Foreign keys | Associate `documents.user_id` with `auth.users.id`. |
| Generated database types | Generate TypeScript definitions from the actual Supabase schema for IntelliSense and compile-time checks. |
| Dynamic App Router routes | Use `[id]` to build document detail pages. |
| `.single()` | Query one expected database row by document ID. |
| Signed URLs | Resolve a private Storage object from the `storage_path` stored in PostgreSQL. |
| Compensation | Remove an uploaded Storage object when the subsequent database operation fails. |
| Tailwind CSS | Add practical UI styling quickly without introducing a separate component or styling architecture. |

## 1. Create the document table

```sql
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text,
  size bigint,
  created_at timestamptz not null default now()
);
```

The `public` prefix is the PostgreSQL schema.

For this stage of the project, application tables remain in `public`. Custom domain schemas can be introduced later when the application grows enough to justify the extra organisation and permission complexity.

## 2. Separate file storage from application metadata

Slice 3 treated Supabase Storage as the source of the document list.

Slice 4 introduces a clearer boundary:

```text
public.documents
   |
   | storage_path
   v
Supabase Storage
```

PostgreSQL stores application-level information about the document, while Supabase Storage stores the actual file bytes.

## 3. Enable Row Level Security

```sql
alter table public.documents enable row level security;
```

Read policy:

```sql
create policy "Users can read their own documents"
on public.documents
for select
to authenticated
using (auth.uid() = user_id);
```

Insert policy:

```sql
create policy "Users can insert their own documents"
on public.documents
for insert
to authenticated
with check (auth.uid() = user_id);
```

Useful distinction:

```text
USING
  -> can this user access this existing row?

WITH CHECK
  -> is this user allowed to create this new row?
```

No update or delete permissions are added yet because the application does not need those operations in this slice.

## 4. Save metadata after Storage upload

The upload Server Action now performs:

```text
authenticate user
   ↓
validate file
   ↓
upload file to Storage
   ↓
insert document metadata into PostgreSQL
   ↓
revalidate /documents
```

Database insert:

```ts
const { error: insertError } = await supabase.from("documents").insert({
  user_id: user.id,
  name: file.name,
  storage_path: filePath,
  mime_type: file.type,
  size: file.size,
});
```

## 5. Handle partial failure

Storage and PostgreSQL are separate operations. If upload succeeds but the database insert fails, the application removes the uploaded file:

```ts
if (insertError) {
  await supabase.storage.from("documents").remove([filePath]);

  return {
    success: false,
    message: insertError.message,
  };
}
```

This is a pragmatic compensation strategy rather than a distributed transaction.

## 6. Generate TypeScript database types

Install the Supabase CLI:

```bash
pnpm add -D supabase
```

Authenticate:

```bash
pnpm supabase login
```

Generate the database types:

```bash
pnpm supabase gen types typescript \
  --project-id <project-ref> \
  --schema public \
  > src/types/database.types.ts
```

Treat `database.types.ts` as generated code.

## 7. Type the Supabase clients

Pass the generated `Database` type into both the server and browser clients:

```ts
import type { Database } from "@/types/database.types";
```

Then:

```ts
createServerClient<Database>(...)
createBrowserClient<Database>(...)
```

Database queries now provide IntelliSense and compile-time checking.

## 8. Make PostgreSQL the document source of truth

Replace the Storage list query with:

```ts
const { data: documents, error: listError } = await supabase
  .from("documents")
  .select("*")
  .order("created_at", { ascending: false });
```

There is no need to rely on `.eq("user_id", user.id)` for authorization because RLS already enforces ownership.

## 9. Build a dynamic document detail route

Create:

```text
src/app/(protected)/documents/[id]/page.tsx
```

Query the document by ID:

```ts
const { data: document, error } = await supabase
  .from("documents")
  .select("*")
  .eq("id", id)
  .single();
```

If it does not exist, or RLS blocks access:

```ts
if (error || !document) {
  notFound();
}
```

## 10. Resolve private Storage access from the database record

Use the stored `storage_path`:

```ts
const { data: signedUrlData } = await supabase.storage
  .from("documents")
  .createSignedUrl(document.storage_path, 60);
```

Architecture:

```text
URL document ID
   ↓
PostgreSQL document
   ↓
database RLS
   ↓
storage_path
   ↓
Storage RLS
   ↓
short-lived signed URL
   ↓
private document
```

## 11. Add basic Tailwind styling

The document list and detail pages use Tailwind utility classes directly.

The goal is rapid application delivery rather than introducing a separate styling architecture prematurely.

## 12. Current document architecture

```text
src/
├── app/
│   └── (protected)/
│       └── documents/
│           ├── [id]/
│           │   └── page.tsx
│           ├── actions.ts
│           ├── page.tsx
│           └── upload-form.tsx
│
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
│
└── types/
    └── database.types.ts
```

Supabase:

```text
Auth
└── auth.users

PostgreSQL
└── public.documents

Storage
└── documents/
    └── <user-id>/
        └── <uuid>-<filename>
```

## 13. Security model

There are now two separate RLS boundaries:

- `public.documents` protects application metadata.
- `storage.objects` protects the underlying private file.

Both are required.

## 14. Verification

Manual checks:

- [x] Authenticated user can upload a document.
- [x] Successful upload creates a Storage object.
- [x] Successful upload creates a `public.documents` row.
- [x] Database row contains the original filename and generated Storage path.
- [x] `/documents` reads from PostgreSQL.
- [x] Documents are ordered newest first.
- [x] Generated database types provide IntelliSense.
- [x] Clicking a document opens `/documents/[id]`.
- [x] Document detail page displays metadata.
- [x] Document detail page can open the private document using a signed URL.
- [x] Tailwind styling works on desktop and narrow layouts.
- [x] Database RLS limits document rows to their owner.
- [x] Storage remains private.

Project checks:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Key takeaways

1. Supabase Storage should store files, while PostgreSQL should model application-level documents.
2. `public` is the default PostgreSQL schema used by the application at this stage.
3. Database RLS should enforce ownership rather than relying only on application query filters.
4. `USING` evaluates access to existing rows; `WITH CHECK` validates new or modified rows.
5. Generated Supabase database types provide a fast way to keep application TypeScript aligned with the database schema.
6. Dynamic App Router segments make database IDs a natural basis for detail pages.
7. Store the complete Storage path instead of reconstructing it from filenames.
8. Operations spanning Storage and PostgreSQL can partially fail; compensating cleanup is a useful pragmatic pattern.
9. Tailwind utility classes are sufficient for quickly building a clean freelance application UI.
10. Start simple and introduce heavier abstractions only when real complexity justifies them.

## Database workflow note

The `documents` table and RLS policies were created directly through Supabase during this learning slice.

That is intentional at this stage so the database concepts can be learned separately from migration/deployment tooling.

A later learning stage will introduce:

```text
Supabase CLI
   ↓
migration files
   ↓
source control
   ↓
development / staging / production
```

## Milestone commit

Before committing:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build

git status --short
git add .
git diff --cached
```

Commit:

```bash
git commit -m "feat: add document metadata and detail view"
```

## Next milestone

Deploy the working DocumentHub application to Vercel.

The deployment learning should cover:

- Vercel project setup;
- environment variables;
- Supabase authentication URLs;
- production deployment;
- verifying authentication and document uploads in the deployed application;
- preview deployments;
- exploring a practical staging → production deployment gate within the available pricing tier.

After deployment, continue with later DocumentHub feature slices.
