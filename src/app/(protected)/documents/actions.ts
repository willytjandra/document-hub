"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

export type UploadState = {
  success: boolean;
  message: string;
};

export const uploadDocument = async (
  _previousState: UploadState,
  formData: FormData,
): Promise<UploadState> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to upload a document.",
    };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      message: "Please select a file.",
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      success: false,
      message: "Only PDF, PNG and JPEG files are allowed.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      message: "File size must be 5 MB or less.",
    };
  }

  const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      message: uploadError.message,
    };
  }
  
  const { error: insertError } = await supabase.from("documents").insert({
    user_id: user.id,
    name: file.name,
    storage_path: filePath,
    mime_type: file.type,
    size: file.size,
  });

  if (insertError) {
    await supabase.storage.from("documents").remove([filePath]);
    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidatePath("/documents");

  return {
    success: true,
    message: "Document uploaded successfully.",
  };
};