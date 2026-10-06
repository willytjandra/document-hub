"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const activateDocument = async (documentId: string) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated.");
  }

  const { error } = await supabase
    .from("documents")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
};

export const archiveDocument = async (documentId: string) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated.");
  }

  const { error } = await supabase
    .from("documents")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
};

export const restoreDocument = async (documentId: string) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated.");
  }

  const { error } = await supabase
    .from("documents")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
};


export const deleteDocument = async (
  documentId: string,
  storagePath: string,
) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated.");
  }

  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([storagePath]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  revalidatePath("/documents");
  redirect("/documents");
};