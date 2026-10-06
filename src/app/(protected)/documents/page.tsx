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

  return (
    <main>
      <h1>Documents</h1>
      <p>Upload and manage your documents here.</p>

      <UploadForm />

      <section>
        <h2>Your documents</h2>

        {documents.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <ul>
            {documents.map((document) => (
              <li key={document.id ?? document.name}>{document.name}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default DocumentsPage;
