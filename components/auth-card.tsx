import Link from "next/link";

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-800">
          ちょこっと整体 予約システム
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
        {title}
      </h1>
      <div className="mt-8">{children}</div>
    </main>
  );
}

export const fieldClassName =
  "mt-1 h-12 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-900 outline-none focus:border-stone-900";

export const primaryButtonClassName =
  "inline-flex h-12 w-full touch-manipulation items-center justify-center rounded-lg bg-stone-900 px-5 text-base text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60";
