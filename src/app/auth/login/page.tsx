import LoginForm from "./login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-slate-500">Welcome back</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in to your account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Access your documents and continue where you left off.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
        >
          Create one
        </Link>
      </p>
    </section>
  );
}
