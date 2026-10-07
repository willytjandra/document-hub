import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./upload-form";
import { StatusBadge } from "./status-badge";
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

  const activeStatus =
    status === "draft" || status === "active" || status === "archived"
      ? status
      : "all";

  const filters = [
    { label: "All", value: "all", href: "/documents" },
    { label: "Draft", value: "draft", href: "/documents?status=draft" },
    { label: "Active", value: "active", href: "/documents?status=active" },
    {
      label: "Archived",
      value: "archived",
      href: "/documents?status=archived",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-medium text-slate-500">Your workspace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Documents
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Upload, organise, and access your documents in one place.
        </p>
      </header>

      <section
        aria-labelledby="upload-heading"
        className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-5">
          <h2 id="upload-heading" className="text-base font-semibold text-slate-900">
            Upload a document
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a PDF or image to your document library.
          </p>
        </div>
        <UploadForm />
      </section>

      <section aria-labelledby="documents-heading">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="documents-heading" className="text-xl font-semibold text-slate-900">
              Your documents
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {documents.length} {documents.length === 1 ? "document" : "documents"}
            </p>
          </div>

          <nav aria-label="Filter documents" className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const isActive = filter.value === activeStatus;

              return (
                <Link
                  key={filter.value}
                  href={filter.href}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                      : "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  }
                >
                  {filter.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No documents uploaded yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {documents.map((document) => (
              <li
                key={document.id}
                className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/documents/${document.id}`}
                      className="break-words font-medium text-slate-900 hover:text-blue-700 hover:underline"
                    >
                      {document.name}
                    </Link>

                    <StatusBadge status={document.status} />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                    <span>{document.mime_type ?? "Unknown type"}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {document.size !== null
                        ? `${(document.size / 1024).toFixed(1)} KB`
                        : "Unknown size"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {new Date(document.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/documents/${document.id}`}
                  className="shrink-0 self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:self-auto"
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
