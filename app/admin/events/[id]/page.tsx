import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { CopyUrlButton } from "@/components/copy-url-button";
import { DeleteEventButton } from "@/components/delete-event-button";
import { getEventDetail } from "@/lib/events";
import { getAppUrl } from "@/lib/env";
import { formatSlotRange } from "@/lib/slots";
import {
  eventStatus,
  eventStatusLabel,
  formatDateTime,
  formatEventDate,
  formatTimeRange,
} from "@/lib/time";

export const metadata: Metadata = {
  title: "開催詳細",
};

export default async function EventDetailPage({
  params,
}: PageProps<"/admin/events/[id]">) {
  const { id } = await params;
  const event = await getEventDetail(id);
  if (!event) {
    notFound();
  }

  const bookedCount = event.slots.filter((slot) => slot.booking).length;
  const status = eventStatus({
    date: event.date,
    startTime: event.start_time,
    slotCount: event.slots.length,
    bookedCount,
  });
  const reservationUrl = `${getAppUrl()}/r/${event.public_token}`;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <AdminHeader
        title={formatEventDate(event.date)}
        actions={
          <Link
            href="/admin"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-300 px-4 text-sm text-stone-800 hover:bg-stone-100"
          >
            一覧へ
          </Link>
        }
      />

      <dl className="mt-8 grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">時間帯</dt>
          <dd className="mt-1 text-stone-900">
            {formatTimeRange(event.start_time, event.end_time)}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">1コマ / 休憩</dt>
          <dd className="mt-1 text-stone-900">
            {event.slot_minutes}分 / {event.break_minutes}分
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">予約</dt>
          <dd className="mt-1 text-stone-900">
            {bookedCount} / {event.slots.length}　{eventStatusLabel(status)}
          </dd>
        </div>
      </dl>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-stone-900">予約URL</h2>
        <div className="mt-2">
          <CopyUrlButton url={reservationUrl} />
        </div>
      </section>

      <section className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="py-2 pr-3 font-medium">時刻</th>
              <th className="py-2 pr-3 font-medium">予約</th>
              <th className="py-2 pr-3 font-medium">予約日時</th>
              <th className="py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {event.slots.map((slot) => (
              <tr key={slot.id} className="border-b border-stone-100">
                <td className="py-3 pr-3 whitespace-nowrap text-stone-900">
                  {formatSlotRange(slot.startsAt, slot.endsAt)}
                </td>
                <td className="py-3 pr-3 text-stone-700">
                  {slot.booking ? (
                    <span>
                      {slot.booking.companyName} / {slot.booking.guestName}
                      <span className="mt-0.5 block text-stone-500">
                        {slot.booking.email}
                      </span>
                    </span>
                  ) : (
                    <span className="text-stone-400">空き</span>
                  )}
                </td>
                <td className="py-3 pr-3 whitespace-nowrap text-stone-600">
                  {slot.booking ? formatDateTime(slot.booking.createdAt) : "—"}
                </td>
                <td className="py-3">
                  {slot.booking ? (
                    <CancelBookingButton
                      bookingId={slot.booking.id}
                      eventId={event.id}
                    />
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-10">
        <DeleteEventButton eventId={event.id} />
      </div>
    </main>
  );
}
