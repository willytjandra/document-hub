import Link from "next/link";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 sm:py-20">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-700"
        >
          DocumentHub
        </Link>
        {children}
      </div>
    </main>
  );
}
