import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/documents"
        className="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Back to documents
      </Link>

      <div className="mb-8">
        <h1 className="break-words text-3xl font-bold">{document.name}</h1>
        <p className="mt-2 text-sm text-gray-600">Document details</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <dl className="space-y-5">
          <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="text-sm">{document.mime_type ?? "Unknown"}</dd>
          </div>

          <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
            <dt className="text-sm font-medium text-gray-500">Size</dt>
            <dd className="text-sm">
              {document.size !== null
                ? `${(document.size / 1024).toFixed(1)} KB`
                : "Unknown"}
            </dd>
          </div>

          <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
            <dt className="text-sm font-medium text-gray-500">Uploaded</dt>
            <dd className="text-sm">
              {new Date(document.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>

        {!signedUrlError && signedUrlData && (
          <div className="mt-8">
            <a
              href={signedUrlData.signedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Open document
            </a>
          </div>
        )}
      </div>
    </main>
  );
};

export default DocumentPage;
