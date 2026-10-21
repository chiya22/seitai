"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createAdminBookingAction,
  updateBookingAction,
  type AdminBookingFormState,
} from "@/app/admin/events/actions";
import { fieldClassName } from "@/components/auth-card";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { SendSurveyButton } from "@/components/send-survey-button";

type BookingInfo = {
  id: string;
  companyName: string;
  guestName: string;
  email: string;
};

function FormButtons({
  submitLabel,
  pendingLabel,
  onCancel,
}: {
  submitLabel: string;
  pendingLabel: string;
  onCancel: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-stone-900 px-3 text-sm text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-300 px-3 text-sm text-stone-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        やめる
      </button>
    </div>
  );
}

function BookingFields({ booking }: { booking?: BookingInfo }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block text-sm text-stone-700">
        会社名
        <input
          className={`${fieldClassName} h-10`}
          name="companyName"
          required
          maxLength={100}
          defaultValue={booking?.companyName ?? ""}
        />
      </label>
      <label className="block text-sm text-stone-700">
        名前
        <input
          className={`${fieldClassName} h-10`}
          name="guestName"
          required
          maxLength={80}
          defaultValue={booking?.guestName ?? ""}
        />
      </label>
      <label className="block text-sm text-stone-700">
        メールアドレス
        <input
          className={`${fieldClassName} h-10`}
          type="email"
          name="email"
          required
          defaultValue={booking?.email ?? ""}
        />
      </label>
    </div>
  );
}

function EditBookingForm({
  eventId,
  booking,
  onClose,
}: {
  eventId: string;
  booking: BookingInfo;
  onClose: () => void;
}) {
  const [state, action] = useActionState<AdminBookingFormState, FormData>(
    updateBookingAction,
    null,
  );

  useEffect(() => {
    if (state?.saved) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="bookingId" value={booking.id} />
      <BookingFields booking={booking} />
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <FormButtons
        submitLabel="保存"
        pendingLabel="保存中…"
        onCancel={onClose}
      />
    </form>
  );
}

function CreateBookingForm({
  eventId,
  slotId,
  onClose,
}: {
  eventId: string;
  slotId: string;
  onClose: () => void;
}) {
  const [state, action] = useActionState<AdminBookingFormState, FormData>(
    createAdminBookingAction,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="slotId" value={slotId} />
      <BookingFields />
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <FormButtons
        submitLabel="登録"
        pendingLabel="登録中…"
        onCancel={onClose}
      />
    </form>
  );
}

export function AdminSlotRow({
  eventId,
  slotId,
  timeLabel,
  createdLabel,
  surveyEnabled,
  booking,
}: {
  eventId: string;
  slotId: string;
  timeLabel: string;
  createdLabel: string;
  surveyEnabled: boolean;
  booking: BookingInfo | null;
}) {
  const [open, setOpen] = useState(false);
  const bookingId = booking?.id ?? null;

  useEffect(() => {
    if (bookingId) {
      setOpen(false);
    }
  }, [bookingId]);

  return (
    <>
      <tr className="border-b border-stone-100">
        <td className="py-3 pr-3 text-stone-900">{timeLabel}</td>
        <td className="py-3 pr-3 break-all text-stone-700">
          {booking ? (
            <span>
              {booking.companyName} / {booking.guestName}
              <span className="mt-0.5 block text-stone-500">{booking.email}</span>
            </span>
          ) : (
            <span className="text-stone-400">空き</span>
          )}
        </td>
        <td className="py-3 pr-3 text-stone-600">{createdLabel}</td>
        <td className="py-3">
          {booking ? (
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-300 px-3 text-sm text-stone-800 hover:bg-stone-100"
              >
                {open ? "閉じる" : "編集"}
              </button>
              <SendSurveyButton
                bookingId={booking.id}
                eventId={eventId}
                enabled={surveyEnabled}
              />
              <CancelBookingButton bookingId={booking.id} eventId={eventId} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-300 px-3 text-sm text-stone-800 hover:bg-stone-100"
            >
              {open ? "閉じる" : "予約を登録"}
            </button>
          )}
        </td>
      </tr>
      {open ? (
        <tr className="border-b border-stone-100">
          <td colSpan={4} className="bg-stone-50 px-3 py-4">
            {booking ? (
              <EditBookingForm
                eventId={eventId}
                booking={booking}
                onClose={() => setOpen(false)}
              />
            ) : (
              <CreateBookingForm
                eventId={eventId}
                slotId={slotId}
                onClose={() => setOpen(false)}
              />
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}
