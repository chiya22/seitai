"use client";

import { useActionState, useState } from "react";
import {
  createBookingAction,
  type BookingFormState,
} from "@/app/r/[token]/actions";
import {
  fieldClassName,
  primaryButtonClassName,
} from "@/components/auth-card";
import type { PublicEvent } from "@/lib/booking";
import { formatSlotRange } from "@/lib/slots";

export function BookingForm({ event }: { event: PublicEvent }) {
  const [state, action, pending] = useActionState<BookingFormState, FormData>(
    createBookingAction,
    null,
  );
  const [slotId, setSlotId] = useState("");
  const selected = event.slots.find((slot) => slot.id === slotId);

  return (
    <form action={action} className="mt-8 space-y-8">
      <input type="hidden" name="token" value={event.token} />
      <input type="hidden" name="slotId" value={slotId} />

      <section>
        <h2 className="text-sm font-medium text-stone-900">コマを選ぶ</h2>
        {selected ? (
          <p className="mt-1 text-sm text-stone-600">
            選択中: {formatSlotRange(selected.startsAt, selected.endsAt)}
          </p>
        ) : (
          <p className="mt-1 text-sm text-stone-500">空きコマを1つ選んでください。</p>
        )}
        <ul className="mt-3 grid grid-cols-1 gap-2">
          {event.slots.map((slot) => {
            const booked = slot.booked;
            const active = slot.id === slotId;
            return (
              <li key={slot.id}>
                <button
                  type="button"
                  disabled={booked || pending}
                  onClick={() => setSlotId(slot.id)}
                  className={`flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg border px-3 py-3 text-base transition-colors ${
                    booked
                      ? "cursor-not-allowed border-stone-200 bg-stone-200 text-stone-400"
                      : active
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-300 bg-white text-stone-900 hover:border-stone-900"
                  }`}
                >
                  {formatSlotRange(slot.startsAt, slot.endsAt)}
                  {booked ? "（予約済み）" : ""}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-stone-900">予約者情報</h2>
        <label className="block text-sm text-stone-700">
          会社名
          <input
            className={fieldClassName}
            name="companyName"
            autoComplete="organization"
            autoCapitalize="words"
            required
            maxLength={100}
          />
        </label>
        <label className="block text-sm text-stone-700">
          名前
          <input
            className={fieldClassName}
            name="guestName"
            autoComplete="name"
            autoCapitalize="words"
            required
            maxLength={80}
          />
        </label>
        <label className="block text-sm text-stone-700">
          メールアドレス
          <input
            className={fieldClassName}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </label>
      </section>

      {state?.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        className={primaryButtonClassName}
        type="submit"
        disabled={pending || !slotId}
      >
        {pending ? "予約中…" : "予約する"}
      </button>
    </form>
  );
}
