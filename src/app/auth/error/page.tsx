import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <section className="mt-8 rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-red-700">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Authentication error</h1>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        We could not confirm your account. The confirmation link may be invalid
        or expired.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/auth/sign-up"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Try again
        </Link>
        <Link
          href="/auth/login"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Return to sign in
        </Link>
      </div>
    </section>
  );
}
