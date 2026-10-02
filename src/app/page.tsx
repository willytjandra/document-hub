const plannedFeatures = [
  {
    title: "Upload documents",
    description: "Keep PDFs and images in one place.",
  },
  {
    title: "Organise your files",
    description: "Find and manage documents from a simple dashboard.",
  },
  {
    title: "Control access",
    description: "Access your documents through a signed-in account.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-slate-200 pb-8">
          <p className="text-sm font-medium text-slate-500">
            Document management, made simple
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            DocumentHub
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            A place to upload, organise, and access your documents.
          </p>
        </header>

        <section aria-labelledby="features-heading" className="mt-10">
          <h2 id="features-heading" className="text-xl font-semibold">
            What&apos;s coming
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {plannedFeatures.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-10 text-sm text-slate-500">
          Currently in development. Sign-in and document management will be
          available in future updates.
        </footer>
      </div>
    </main>
  );
}
