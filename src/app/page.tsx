import Link from "next/link";

const features = [
  {
    title: "Private storage",
    description: "Keep your PDFs and images in a private document library.",
  },
  {
    title: "Secure access",
    description: "Open your files through secure, short-lived access links.",
  },
  {
    title: "Simple lifecycle",
    description: "Move documents from draft to active to archived as they change.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            DocumentHub
          </Link>

          <nav aria-label="Account navigation" className="flex items-center gap-3 text-sm">
            <Link
              href="/auth/login"
              className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-white hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white hover:bg-slate-700"
            >
              Create an account
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-slate-500">
              Document management, made simple
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
              A simpler home for your documents.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Upload, organise, and securely access your important files from one
              focused workspace.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/sign-up"
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Get started
              </Link>
              <Link
                href="/auth/login"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700"
              >
                Sign in to your workspace
              </Link>
              .
            </p>
          </div>

          <section aria-labelledby="features-heading" className="mt-20">
            <h2 id="features-heading" className="text-base font-semibold">
              Everything you need to manage your files
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <footer className="border-t border-slate-200 py-5 text-sm text-slate-500">
          DocumentHub — a focused workspace for your documents.
        </footer>
      </div>
    </main>
  );
}
