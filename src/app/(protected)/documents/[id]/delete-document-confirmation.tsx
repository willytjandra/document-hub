"use client";

import { useState } from "react";
import { deleteDocument } from "./actions";

type DeleteDocumentConfirmationProps = {
  documentId: string;
  storagePath: string;
};

export const DeleteDocumentConfirmation = ({
  documentId,
  storagePath,
}: DeleteDocumentConfirmationProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const deleteAction = deleteDocument.bind(null, documentId, storagePath);

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Delete permanently
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-900">
        Permanently delete this document?
      </p>
      <p className="mt-1 text-sm text-red-800">
        This removes the document and its stored file. This action cannot be
        undone.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <form action={deleteAction}>
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Yes, delete permanently
          </button>
        </form>
      </div>
    </div>
  );
};
