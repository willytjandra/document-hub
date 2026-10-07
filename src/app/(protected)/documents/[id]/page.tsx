import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "../status-badge";
import { DeleteDocumentConfirmation } from "./delete-document-confirmation";
import {
  activateDocument,
  archiveDocument,
  restoreDocument,
} from "./actions";

type DocumentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const DocumentPage = async ({ params }: DocumentPageProps) => {
  const { id } = await params;

  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !document) {
    notFound();
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.storage_path, 60);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
      <Link
        href="/documents"
        className="mb-8 inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
      >
        <span aria-hidden="true">←</span>
        <span className="ml-2">Back to documents</span>
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-slate-500">Document details</p>
          <StatusBadge status={document.status} />
        </div>
        <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-slate-900">
          {document.name}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review the file metadata and manage its lifecycle.
        </p>
      </header>

      <section
        aria-labelledby="metadata-heading"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 id="metadata-heading" className="text-base font-semibold text-slate-900">
          File information
        </h2>

        <dl className="mt-6 divide-y divide-slate-100">
          <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[120px_1fr] sm:gap-4">
            <dt className="text-sm font-medium text-slate-500">Type</dt>
            <dd className="text-sm text-slate-900">{document.mime_type ?? "Unknown"}</dd>
          </div>

          <div className="grid gap-1 py-4 sm:grid-cols-[120px_1fr] sm:gap-4">
            <dt className="text-sm font-medium text-slate-500">Size</dt>
            <dd className="text-sm text-slate-900">
              {document.size !== null
                ? `${(document.size / 1024).toFixed(1)} KB`
                : "Unknown"}
            </dd>
          </div>

          <div className="grid gap-1 py-4 last:pb-0 sm:grid-cols-[120px_1fr] sm:gap-4">
            <dt className="text-sm font-medium text-slate-500">Uploaded</dt>
            <dd className="text-sm text-slate-900">
              {new Date(document.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>

        {!signedUrlError && signedUrlData ? (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <a
              href={signedUrlData.signedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Open document
            </a>
          </div>
        ) : (
          <div
            role="alert"
            className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <p className="font-medium">This document could not be opened.</p>
            <p className="mt-1">
              We could not create a secure access link. Please try again later.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="actions-heading" className="mt-8">
        <h2 id="actions-heading" className="text-base font-semibold text-slate-900">
          Document actions
        </h2>

        <div className="mt-4">
          {document.status === "draft" && (
            <form
              action={async () => {
                "use server";
                await activateDocument(document.id);
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Mark as active
              </button>
            </form>
          )}

          {document.status === "active" && (
            <form
              action={async () => {
                "use server";
                await archiveDocument(document.id);
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Archive
              </button>
            </form>
          )}

          {document.status === "archived" && (
            <div className="space-y-5">
              <form
                action={async () => {
                  "use server";
                  await restoreDocument(document.id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Restore
                </button>
              </form>

              <div className="border-t border-slate-200 pt-5">
                <p className="mb-3 text-sm font-medium text-slate-900">
                  Danger zone
                </p>
                <DeleteDocumentConfirmation
                  documentId={document.id}
                  storagePath={document.storage_path}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default DocumentPage;
