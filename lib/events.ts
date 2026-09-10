import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateSlots } from "@/lib/slots";
import { eventStatus, type EventStatus } from "@/lib/time";

export type EventRecord = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  break_minutes: number;
  public_token: string;
};

export type EventListItem = EventRecord & {
  slotCount: number;
  bookedCount: number;
  status: EventStatus;
};

export type SlotWithBooking = {
  id: string;
  startsAt: string;
  endsAt: string;
  sortIndex: number;
  booking: {
    id: string;
    companyName: string;
    guestName: string;
    email: string;
    createdAt: string;
  } | null;
};

export type EventDetail = EventRecord & {
  slots: SlotWithBooking[];
};

type BookingRow = {
  id: string;
  company_name: string;
  guest_name: string;
  email: string;
  created_at: string;
  cancelled_at: string | null;
};

function createPublicToken() {
  return randomBytes(16).toString("base64url");
}

export async function listEvents(): Promise<EventListItem[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("events")
    .select(
      "id, date, start_time, end_time, slot_minutes, break_minutes, public_token, slots(id), bookings(id, cancelled_at)",
    )
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((event) => {
    const slotCount = event.slots.length;
    const bookedCount = event.bookings.filter(
      (booking) => booking.cancelled_at === null,
    ).length;
    return {
      id: event.id,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      slot_minutes: event.slot_minutes,
      break_minutes: event.break_minutes,
      public_token: event.public_token,
      slotCount,
      bookedCount,
      status: eventStatus({
        date: event.date,
        startTime: event.start_time,
        slotCount,
        bookedCount,
      }),
    };
  });
}

export async function getEventDetail(id: string): Promise<EventDetail | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("events")
    .select(
      "id, date, start_time, end_time, slot_minutes, break_minutes, public_token, slots(id, starts_at, ends_at, sort_index, bookings(id, company_name, guest_name, email, created_at, cancelled_at))",
    )
    .eq("id", id)
    .order("sort_index", { referencedTable: "slots", ascending: true })
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    date: data.date,
    start_time: data.start_time,
    end_time: data.end_time,
    slot_minutes: data.slot_minutes,
    break_minutes: data.break_minutes,
    public_token: data.public_token,
    slots: [...data.slots]
      .sort((left, right) => left.sort_index - right.sort_index)
      .map((slot) => {
      const booking = (slot.bookings as BookingRow[]).find(
        (row) => row.cancelled_at === null,
      );
      return {
        id: slot.id,
        startsAt: slot.starts_at,
        endsAt: slot.ends_at,
        sortIndex: slot.sort_index,
        booking: booking
          ? {
              id: booking.id,
              companyName: booking.company_name,
              guestName: booking.guest_name,
              email: booking.email,
              createdAt: booking.created_at,
            }
          : null,
      };
    }),
  };
}

export async function createEvent(input: {
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  breakMinutes: number;
}): Promise<string> {
  const slots = generateSlots(input);
  const admin = createSupabaseAdminClient();
  const startTime = input.startTime.length === 5 ? `${input.startTime}:00` : input.startTime;
  const endTime = input.endTime.length === 5 ? `${input.endTime}:00` : input.endTime;

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: event, error } = await admin
      .from("events")
      .insert({
        date: input.date,
        start_time: startTime,
        end_time: endTime,
        slot_minutes: input.slotMinutes,
        break_minutes: input.breakMinutes,
        public_token: createPublicToken(),
      })
      .select("id")
      .single();

    if (error || !event) {
      lastError = error?.message ?? "開催を保存できませんでした。";
      continue;
    }

    const { error: slotError } = await admin.from("slots").insert(
      slots.map((slot) => ({
        event_id: event.id,
        starts_at: slot.startsAt,
        ends_at: slot.endsAt,
        sort_index: slot.sortIndex,
      })),
    );

    if (slotError) {
      await admin.from("events").delete().eq("id", event.id);
      throw new Error("コマの保存に失敗しました。");
    }

    return event.id;
  }

  throw new Error(lastError ?? "開催を保存できませんでした。");
}

export async function deleteEvent(id: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("events").delete().eq("id", id);
  if (error) {
    throw error;
  }
}
