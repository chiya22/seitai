import type { Metadata } from "next";
import { getPublicEventByToken } from "@/lib/booking";
import { BookingForm } from "@/components/booking-form";
import { formatSlotRange } from "@/lib/slots";
import { formatEventDate, formatTimeRange } from "@/lib/time";

export const metadata: Metadata = {
  title: "予約",
};

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16 pb-[max(4rem,env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
        {title}
      </h1>
      <p className="mt-4 leading-relaxed text-stone-600">{body}</p>
    </main>
  );
}

export default async function ReservationPage({
  params,
}: PageProps<"/r/[token]">) {
  const { token } = await params;
  const event = await getPublicEventByToken(token);

  if (!event) {
    return (
      <Message
        title="この予約ページは見つかりません"
        body="URLをご確認ください。案内されたリンクから開き直してください。"
      />
    );
  }

  if (event.status === "closed") {
    return (
      <Message
        title="予約の受付は終了しました"
        body={`${formatEventDate(event.date)} ${formatTimeRange(event.startTime, event.endTime)} の予約は締め切っています。`}
      />
    );
  }

  const isFull = event.status === "full";

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <p className="text-sm text-stone-500">ちょこっと整体 予約システム</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
        予約
      </h1>
      <p className="mt-3 text-stone-700">
        {formatEventDate(event.date)}
        <span className="mt-1 block text-sm text-stone-600">
          {formatTimeRange(event.startTime, event.endTime)}
        </span>
      </p>
      {isFull ? (
        <p className="mt-8 rounded-lg border border-stone-200 bg-stone-100 px-4 py-3 text-sm text-stone-700">
          満席です。
        </p>
      ) : null}
      {isFull ? (
        <ul className="mt-4 grid grid-cols-1 gap-2">
          {event.slots.map((slot) => (
            <li
              key={slot.id}
              className="flex min-h-12 items-center justify-center rounded-lg border border-stone-200 bg-stone-200 px-3 py-3 text-base text-stone-400"
            >
              {formatSlotRange(slot.startsAt, slot.endsAt)}（予約済み）
            </li>
          ))}
        </ul>
      ) : (
        <BookingForm event={event} />
      )}
    </main>
  );
}
