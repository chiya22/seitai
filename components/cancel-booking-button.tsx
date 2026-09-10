"use client";

import { useFormStatus } from "react-dom";
import { cancelBookingAction } from "@/app/admin/events/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 px-3 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "取り消しています…" : "予約を取り消す"}
    </button>
  );
}

export function CancelBookingButton({
  bookingId,
  eventId,
}: {
  bookingId: string;
  eventId: string;
}) {
  return (
    <form
      action={cancelBookingAction}
      onSubmit={(event) => {
        const ok = window.confirm("この予約を取り消します。よろしいですか？");
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton />
    </form>
  );
}
