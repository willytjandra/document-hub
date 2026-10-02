import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <main>
      <h1>Dashboard</h1>

      <p>You are authenticated.</p>

      <p>User ID: {data.claims.sub}</p>

      <p>Email: {data.claims.email}</p>

      <form action="/auth/signout" method="post">
        <button type="submit">Logout</button>
      </form>
    </main>
  );
}
