import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { listEvents } from "@/lib/events";
import {
  eventStatusLabel,
  formatEventDate,
  formatTimeRange,
} from "@/lib/time";

export const metadata: Metadata = {
  title: "開催一覧",
};

function statusClass(status: "open" | "full" | "closed") {
  if (status === "open") {
    return "bg-emerald-50 text-emerald-800";
  }
  if (status === "full") {
    return "bg-amber-50 text-amber-800";
  }
  return "bg-stone-100 text-stone-600";
}

export default async function AdminHomePage() {
  const events = await listEvents();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <AdminHeader
        title="開催一覧"
        actions={
          <Link
            href="/admin/events/new"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-900 px-4 text-sm text-white hover:bg-stone-700"
          >
            開催を作る
          </Link>
        }
      />

      {events.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-stone-300 px-4 py-10 text-center text-stone-500">
          開催はまだありません。
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/events/${event.id}`}
                className="flex flex-col gap-1 px-4 py-4 hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="block font-medium text-stone-900">
                    {formatEventDate(event.date)}
                  </span>
                  <span className="text-sm text-stone-600">
                    {formatTimeRange(event.start_time, event.end_time)}
                  </span>
                </span>
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-stone-600">
                    {event.bookedCount} / {event.slotCount}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${statusClass(event.status)}`}
                  >
                    {eventStatusLabel(event.status)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
