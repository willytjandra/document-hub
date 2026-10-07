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
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="file"
          className="block text-sm font-medium text-slate-900"
        >
          Choose a document
        </label>
        <p id="file-help" className="mt-1 text-sm text-slate-600">
          PDF, PNG, or JPEG files up to 5 MB.
        </p>

        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          aria-describedby="file-help"
          required
          disabled={isPending}
          className="mt-3 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? "Uploading..." : "Upload"}
      </button>

      {state.message && (
        <p
          role={state.success ? "status" : "alert"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
};
