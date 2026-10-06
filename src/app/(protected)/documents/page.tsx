import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./upload-form";

const DocumentsPage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated.");
  }

  const { data: documents, error: listError } = await supabase.storage
    .from("documents")
    .list(user.id);

  if (listError) {
    throw new Error(listError.message);
  }

  const documentsWithUrls = await Promise.all(
    documents.map(async (document) => {
      const path = `${user.id}/${document.name}`;

      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(path, 60);

      return {
        ...document,
        signedUrl: error ? null : data.signedUrl,
      };
    }),
  );

  return (
    <main>
      <h1>Documents</h1>
      <p>Upload and manage your documents here.</p>

      <UploadForm />

      <section>
        <h2>Your documents</h2>

        {documentsWithUrls.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <ul>
            {documentsWithUrls.map((document) => (
              <li key={document.id ?? document.name}>
                <span>{document.name}</span>

                {document.signedUrl && (
                  <>
                    {" "}
                    <a
                      href={document.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default DocumentsPage;
