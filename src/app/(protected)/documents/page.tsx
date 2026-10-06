import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./upload-form";
import Link from "next/link";

type DocumentsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const DocumentsPage = async ({ searchParams }: DocumentsPageProps) => {
  const { status } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated.");
  }

  let query = supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (status === "draft" || status === "active" || status === "archived") {
    query = query.eq("status", status);
  }

  const { data: documents, error: listError } = await query;

  if (listError) {
    throw new Error(listError.message);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload and manage your documents here.
        </p>
      </div>

      <div className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <UploadForm />
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Your documents</h2>
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/documents"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            All
          </Link>

          <Link
            href="/documents?status=draft"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Draft
          </Link>

          <Link
            href="/documents?status=active"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Active
          </Link>

          <Link
            href="/documents?status=archived"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Archived
          </Link>
        </div>
        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No documents uploaded yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex items-center justify-between gap-6 rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/documents/${document.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {document.name}
                    </Link>

                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {document.status}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-2 text-sm text-gray-500">
                    <span>{document.mime_type ?? "Unknown type"}</span>
                    <span>·</span>
                    <span>
                      {document.size !== null
                        ? `${(document.size / 1024).toFixed(1)} KB`
                        : "Unknown size"}
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(document.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/documents/${document.id}`}
                  className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default DocumentsPage;
