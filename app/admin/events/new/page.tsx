import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { EventForm } from "@/components/event-form";
import { todayInTokyo } from "@/lib/time";

export const metadata: Metadata = {
  title: "開催を作る",
};

export default function NewEventPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <AdminHeader
        title="開催を作る"
        actions={
          <Link
            href="/admin"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-300 px-4 text-sm text-stone-800 hover:bg-stone-100"
          >
            一覧へ
          </Link>
        }
      />
      <p className="mt-6 text-sm leading-relaxed text-stone-600">
        日付と時間帯を入れると、コマが自動で並びます。内容を確認してから作成してください。
      </p>
      <div className="mt-8">
        <EventForm defaultDate={todayInTokyo()} />
      </div>
    </main>
  );
}
