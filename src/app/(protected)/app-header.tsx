import Link from "next/link";

type AppHeaderProps = {
  email: string | null;
};

export const AppHeader = ({ email }: AppHeaderProps) => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link
          href="/documents"
          className="text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-700"
        >
          DocumentHub
        </Link>

        <div className="flex min-w-0 items-center gap-3 text-sm">
          {email && (
            <span className="max-w-[45vw] truncate text-slate-600 sm:max-w-48">
              {email}
            </span>
          )}

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
