import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

type ProtectedLayoutProps = {
  children: ReactNode;
};

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return children;
};

export default ProtectedLayout;
