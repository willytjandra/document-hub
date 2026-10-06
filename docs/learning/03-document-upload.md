# Slice 3 — Document Upload with Supabase Storage

Status: Complete

## Outcome

Add authenticated document upload to DocumentHub using a private Supabase Storage bucket.

At the end of this slice the application supports:

- a protected `/documents` page;
- uploading PDF, PNG, and JPEG files;
- server-side file validation;
- a private `documents` Storage bucket;
- per-user Storage Row Level Security;
- user-specific object paths;
- document listing;
- automatic page revalidation after upload;
- short-lived signed URLs for opening private documents;
- inline upload success, failure, and pending states.

## What I learned

| Topic | Practical outcome |
| --- | --- |
| Supabase Storage | Store user-uploaded files in a private bucket. |
| Storage RLS | Restrict users to objects stored under their own user ID folder. |
| Server Actions | Handle application-owned file-upload mutations from a React form. |
| Server Components | Read and render document lists without adding another application API hop. |
| `useActionState` | Display expected upload errors and pending state in the form. |
| `revalidatePath()` | Refresh server-rendered data after a mutation. |
| Signed URLs | Give a browser temporary access to a private Storage object. |
| Trust boundaries | Authenticate, authorize, and validate again inside server entry points even when the page is protected. |
| Route Handlers vs Server Actions | Distinguish explicit HTTP APIs from Next.js-managed mutation endpoints. |
| File organisation | Use simple colocated files first and refactor into feature/action/service structure when complexity justifies it. |

## 1. Create a private Storage bucket

Create a Supabase Storage bucket named:

```text
documents
```

Keep the bucket private.

A private bucket means uploaded business documents are not directly accessible through a permanent public URL.

The application stores objects using this shape:

```text
documents/
  <user-id>/
    <uuid>-<original-filename>
```

For example:

```text
documents/
  4f16a.../
    7e122...-invoice.pdf
```

The first folder segment becomes part of the authorization model.

## 2. Understand Storage metadata and RLS

Supabase Storage stores object metadata in PostgreSQL under `storage.objects`.

That allows PostgreSQL Row Level Security to control access to Storage objects.

The important values for this slice are:

```text
bucket_id
name
owner_id
```

The authenticated Supabase user is available to policies through:

```sql
auth.uid()
```

For an object named:

```text
4f16a.../invoice.pdf
```

Supabase can read the first folder using:

```sql
(storage.foldername(name))[1]
```

The authorization rule is therefore:

```text
bucket is documents
AND
first object folder = authenticated user ID
```

## 3. Storage RLS policies

The upload policy:

```sql
create policy "Users can upload their own documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

The read policy:

```sql
create policy "Users can read their own documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

No `UPDATE` or `DELETE` permissions are granted yet.

This follows least privilege: only add operations when the application actually needs them.

### `USING` vs `WITH CHECK`

A useful rule of thumb:

```text
SELECT / DELETE
  -> USING

INSERT
  -> WITH CHECK

UPDATE
  -> commonly both USING and WITH CHECK
```

The Storage policy is a second security boundary. Even if application code accidentally requests another user's path, RLS should still reject the operation.

## 4. Protected documents page

The page lives under the protected route group:

```text
src/app/(protected)/documents/page.tsx
```

Its public URL is still:

```text
/documents
```

because route-group folder names in parentheses do not become URL segments.

The protected layout answers:

```text
Is the user authenticated?
```

Storage RLS answers:

```text
Can this authenticated user access this specific object?
```

These are separate responsibilities.

## 5. Upload form

The initial upload form uses a normal file input:

```tsx
<form action={uploadDocument}>
  <input
    id="file"
    name="file"
    type="file"
    accept=".pdf,.png,.jpg,.jpeg"
    required
  />

  <button type="submit">Upload</button>
</form>
```

The browser-side `accept` and `required` attributes improve user experience, but they are not security controls.

The server must validate the upload again.

## 6. Upload Server Action

The upload is implemented as a Server Action in the feature directory:

```text
src/app/(protected)/documents/
  actions.ts
  page.tsx
  upload-form.tsx
```

The action performs this flow:

```text
form submission
   -> Server Action
   -> authenticate user
   -> validate file
   -> generate user-scoped object path
   -> Supabase Storage upload
   -> Storage INSERT RLS
```

A simplified version:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export const uploadDocument = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to upload a document.");
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("No file selected.");
  }

  const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }
};
```

### Why authenticate inside the action?

The `/documents` page is already under a protected layout, but the Server Action is still a server entry point triggered through an HTTP request managed by Next.js.

The correct security model is:

```text
Protected page
  -> protects rendering/navigation

Server Action
  -> authenticates and validates the mutation

Storage RLS
  -> authorizes access to the object
```

Do not rely on a protected UI as authorization for a mutation.

## 7. Server-side file validation

The application allows:

```text
application/pdf
image/png
image/jpeg
```

with a maximum size of:

```text
5 MB
```

Validation checks:

```text
file exists
file is not empty
allowed MIME type
file <= size limit
```

Example:

```ts
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];
```

A filename extension alone is not a trustworthy validation mechanism.

MIME type is a better first validation layer, although high-risk applications may additionally inspect actual file signatures because client-supplied MIME metadata can also be forged.

## 8. Better upload state with `useActionState`

Expected validation errors should be returned as application state instead of crashing the page.

The action returns:

```ts
type UploadState = {
  success: boolean;
  message: string;
};
```

The interactive upload form becomes a small Client Component:

```text
page.tsx
   -> Server Component

upload-form.tsx
   -> Client Component
   -> useActionState()

actions.ts
   -> Server Action
```

`useActionState()` changes the Server Action signature from:

```ts
(formData)
```

to:

```ts
(previousState, formData)
```

This gives the UI a pending state and lets it display success or validation messages without moving the page itself to the client.

## 9. List documents in the Server Component

Document listing is a read operation, so the page reads directly from Supabase in the Server Component:

```ts
const { data: documents, error } = await supabase.storage
  .from("documents")
  .list(user.id);
```

This reads objects under:

```text
documents/<user-id>/
```

and the Storage `SELECT` policy still applies.

The important architectural decision is:

```text
READ initial page data
  -> Server Component

WRITE / mutation
  -> Server Action
```

This avoids an unnecessary browser-to-Next.js API request for data the Server Component can load directly.

## 10. Revalidate after upload

After a successful upload, the action calls:

```ts
revalidatePath("/documents");
```

This invalidates the server-rendered route data so the new document appears in the list after the mutation.

The mutation flow becomes:

```text
upload
  -> Storage succeeds
  -> revalidate /documents
  -> Server Component renders fresh list
```

## 11. Signed URLs for private documents

Because the bucket is private, a browser cannot use a permanent public object URL to open a document.

The page generates a short-lived signed URL:

```ts
const { data, error } = await supabase.storage
  .from("documents")
  .createSignedUrl(path, 60);
```

The `60` means the URL is valid for 60 seconds.

The flow is:

```text
private object
  -> authenticated server request
  -> create signed URL
  -> temporary browser-accessible URL
  -> open/download file
```

Signed URLs are needed only when the browser needs temporary direct access to a private file.

For a small learning app, generating signed URLs while rendering the list is simple and acceptable. For a large list, a better design would generate one only when the user requests a specific file.

## 12. Server Actions and HTTP endpoints

A useful clarification from this slice is that a Server Action is still triggered through an HTTP request to the Next.js server.

However, Next.js owns the transport details rather than exposing a stable application-designed URL.

Conceptually:

```text
<form action={uploadDocument}>
   -> Next.js-managed POST
   -> Server Action
```

Server Actions are therefore best treated as server entry points and given the same trust-boundary discipline as explicit HTTP endpoints:

```text
authenticate
  -> authorize
  -> validate
  -> perform mutation
```

### Are Server Actions always POST-like?

Yes. Server Actions use POST transport and are primarily intended for mutations.

They can technically return data, but they are not the preferred general-purpose query mechanism.

The convention adopted for this project is:

```text
Initial read
  -> Server Component

Application-owned mutation
  -> Server Action

Explicit client/external HTTP API
  -> Route Handler
```

## 13. Route Handler path reminder

Unlike Server Actions, Route Handlers have explicit URL paths determined by the App Router directory structure.

For example:

```text
src/app/api/documents/route.ts
```

maps to:

```text
/api/documents
```

and:

```ts
export const GET = async () => {};
export const POST = async () => {};
```

defines the HTTP methods available at that path.

Likewise:

```text
src/app/auth/confirm/route.ts
```

maps to:

```text
/auth/confirm
```

The `api` folder is a convention, not a requirement.

## 14. File organisation decision

For this small slice, the implementation stays colocated:

```text
src/app/(protected)/documents/
  actions.ts
  page.tsx
  upload-form.tsx
```

A more explicit structure such as:

```text
features/documents/
  actions/
    uploadDocument.action.ts
    deleteDocument.action.ts
  queries/
    listDocuments.query.ts
  services/
    documentStorage.service.ts
```

would become useful as the application grows.

The deliberate learning approach is to start with the simple structure, experience the point where it becomes awkward, and then refactor. That makes the evolution from a small application to a larger production codebase visible in the project history.

## 15. Final structure

The Slice 3 structure is approximately:

```text
src/
├── app/
│   └── (protected)/
│       ├── layout.tsx
│       └── documents/
│           ├── actions.ts
│           ├── page.tsx
│           └── upload-form.tsx
│
└── lib/
    └── supabase/
        └── server.ts
```

Supabase Storage:

```text
documents/
  <user-id>/
    <uuid>-<filename>
```

## 16. Verification

Manual checks:

- [x] Authenticated user can open `/documents`.
- [x] User can upload a PDF, PNG, or JPEG under 5 MB.
- [x] Uploaded object is stored under the authenticated user's ID folder.
- [x] Invalid or empty uploads produce a user-facing message.
- [x] Uploaded documents appear in the document list.
- [x] The list refreshes after a successful upload.
- [x] A private document can be opened using a signed URL.
- [x] The Storage bucket remains private.
- [x] Storage policies restrict reads and inserts to the authenticated user's folder.

Project checks:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Key takeaways

1. Private Storage and Storage RLS solve different parts of document security: the bucket is non-public, while RLS controls which authenticated user can access which object.
2. Protecting a page does not remove the need to authenticate and authorize a Server Action.
3. Server Actions are best suited to application-owned mutations; Server Components are a natural place for initial reads.
4. Route Handlers are preferable when the application needs an explicit HTTP API contract.
5. Browser file restrictions such as `accept` are UX only; server-side validation remains required.
6. `revalidatePath()` connects a mutation back to server-rendered read state.
7. Signed URLs provide temporary browser access without making a private bucket public.
8. A simple colocated feature structure is appropriate at this size; refactoring should happen when growing complexity creates a real need.

## Milestone commits

The slice was intentionally committed in stages to preserve the learning history:

```text
feat: add document upload and listing with Supabase Storage
feat: add signed access to private documents
```

## Next slice

**Slice 4 — Document List, Details, and Download**

Basic listing and signed access were introduced in Slice 3, so Slice 4 should build on them rather than repeat them.

A useful next progression is to introduce application-level document metadata in PostgreSQL and treat Supabase Storage as the file layer rather than the application's complete source of truth.

Potential additions include:

- a `documents` database table;
- original filename and storage path metadata;
- document status and timestamps;
- a document detail page;
- clearer download/open behaviour;
- ownership enforced through database RLS as well as Storage RLS;
- a clearer separation between file objects and application records.
