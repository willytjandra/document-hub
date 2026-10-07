import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "./app-header";

type ProtectedLayoutProps = {
  children: ReactNode;
};

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader email={email} />
      {children}
    </div>
  );
};

export default ProtectedLayout;
