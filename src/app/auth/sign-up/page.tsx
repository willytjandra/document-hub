import SignUpForm from "./sign-up-form";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-slate-500">Get started</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Set up a secure account to start managing your documents.
      </p>

      <div className="mt-8">
        <SignUpForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}
