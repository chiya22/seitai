"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createEventAction,
  type EventFormState,
} from "@/app/admin/events/actions";
import {
  fieldClassName,
  primaryButtonClassName,
} from "@/components/auth-card";
import {
  GenerateSlotsError,
  formatSlotRange,
  generateSlots,
} from "@/lib/slots";

type EventFormProps = {
  defaultDate: string;
};

export function EventForm({ defaultDate }: EventFormProps) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(
    createEventAction,
    null,
  );
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [slotMinutes, setSlotMinutes] = useState("20");
  const [breakMinutes, setBreakMinutes] = useState("5");

  const preview = useMemo(() => {
    const slotValue = Number(slotMinutes);
    const breakValue = Number(breakMinutes);
    if (!date || !startTime || !endTime) {
      return { error: "日付と時間帯を入力してください。", slots: [] };
    }
    try {
      return {
        error: null,
        slots: generateSlots({
          date,
          startTime,
          endTime,
          slotMinutes: slotValue,
          breakMinutes: breakValue,
        }),
      };
    } catch (error) {
      const message =
        error instanceof GenerateSlotsError
          ? error.message
          : "コマを生成できません。";
      return { error: message, slots: [] };
    }
  }, [date, startTime, endTime, slotMinutes, breakMinutes]);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-stone-700">
          日付
          <input
            className={fieldClassName}
            type="date"
            name="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-stone-700">
            開始
            <input
              className={fieldClassName}
              type="time"
              name="startTime"
              required
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>
          <label className="block text-sm text-stone-700">
            終了
            <input
              className={fieldClassName}
              type="time"
              name="endTime"
              required
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm text-stone-700">
          1コマ（分）
          <input
            className={fieldClassName}
            type="number"
            name="slotMinutes"
            min={1}
            step={1}
            required
            value={slotMinutes}
            onChange={(event) => setSlotMinutes(event.target.value)}
          />
        </label>
        <label className="block text-sm text-stone-700">
          休憩（分）
          <input
            className={fieldClassName}
            type="number"
            name="breakMinutes"
            min={0}
            step={1}
            required
            value={breakMinutes}
            onChange={(event) => setBreakMinutes(event.target.value)}
          />
        </label>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-medium text-stone-900">生成されるコマ</h2>
        {preview.error ? (
          <p className="mt-3 text-sm text-stone-500">{preview.error}</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {preview.slots.map((slot) => (
              <li
                key={slot.sortIndex}
                className="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-800"
              >
                {formatSlotRange(slot.startsAt, slot.endsAt)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {state?.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        className={`${primaryButtonClassName} sm:w-auto`}
        type="submit"
        disabled={pending || Boolean(preview.error)}
      >
        {pending ? "作成中…" : "この内容で作成"}
      </button>
    </form>
  );
}
