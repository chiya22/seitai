"use client";

import { deleteEventAction } from "@/app/admin/events/actions";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  return (
    <form
      action={deleteEventAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          "この開催を削除します。予約も消えて元に戻せません。よろしいですか？",
        );
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-lg border border-red-200 px-4 text-sm text-red-700 hover:bg-red-50"
      >
        この開催を削除
      </button>
    </form>
  );
}
