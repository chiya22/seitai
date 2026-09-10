import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";

export function AdminHeader({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm text-stone-500">
          <Link href="/admin" className="hover:text-stone-800">
            ちょこっと整体 予約システム
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-300 px-4 text-sm text-stone-800 hover:bg-stone-100"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  );
}
