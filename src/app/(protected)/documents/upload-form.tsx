"use client";

import { useActionState } from "react";
import { uploadDocument, type UploadState } from "./actions";

const initialState: UploadState = {
  success: false,
  message: "",
};

export const UploadForm = () => {
  const [state, formAction, isPending] = useActionState(
    uploadDocument,
    initialState,
  );

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="file">Choose a document</label>

        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          required
        />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? "Uploading..." : "Upload"}
      </button>

      {state.message && <p>{state.message}</p>}
    </form>
  );
};
