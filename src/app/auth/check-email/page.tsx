import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-emerald-700">Almost there</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Check your email</h1>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        We sent you a confirmation link. Open the link in your email to activate
        your account.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/auth/login"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Return to sign in
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
