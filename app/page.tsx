import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm text-stone-500">出張整体の予約</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
        ちょこっと整体 予約システム
      </h1>
      <p className="mt-4 leading-relaxed text-stone-600">
        開催の空きコマを選んで予約します。案内を受け取った方は、送られた専用のURLからお進みください。
      </p>
      <p className="mt-10">
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-stone-900 px-5 text-white transition-colors hover:bg-stone-700"
        >
          管理者ログイン
        </Link>
      </p>
    </main>
  );
}
