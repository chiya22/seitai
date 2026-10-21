"use client";

import { useFormStatus } from "react-dom";
import {
  sendAllSurveysAction,
  sendSurveyAction,
} from "@/app/admin/events/actions";

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-300 px-3 text-sm text-stone-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function SendSurveyButton({
  bookingId,
  eventId,
  enabled,
}: {
  bookingId: string;
  eventId: string;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <span className="text-xs text-stone-400">URL未設定</span>
    );
  }

  return (
    <form
      action={sendSurveyAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          "この予約者にアンケート案内を送ります。よろしいですか？",
        );
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton label="アンケートを送る" pendingLabel="送信中…" />
    </form>
  );
}

export function SendAllSurveysButton({
  eventId,
  enabled,
  bookingCount,
}: {
  eventId: string;
  enabled: boolean;
  bookingCount: number;
}) {
  if (!enabled || bookingCount === 0) {
    return null;
  }

  return (
    <form
      action={sendAllSurveysAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          `有効な予約者 ${bookingCount} 人にアンケート案内を送ります。よろしいですか？`,
        );
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton
        label="予約者全員に送る"
        pendingLabel="送信中…"
      />
    </form>
  );
}
