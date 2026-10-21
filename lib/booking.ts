import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  cancelScheduledMail,
  sendBookingCancelledMails,
  sendBookingCreatedMails,
  sendSurveyRequestMail,
  type BookingMailPayload,
} from "@/lib/mail";
import { scheduleReminderForBooking } from "@/lib/reminder";
import { eventStatus, type EventStatus } from "@/lib/time";

export class BookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingError";
  }
}

export type PublicSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  booked: boolean;
};

export type PublicEvent = {
  id: string;
  token: string;
  date: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  slots: PublicSlot[];
};

export type BookingReceipt = {
  token: string;
  date: string;
  startsAt: string;
  endsAt: string;
  companyName: string;
  guestName: string;
  email: string;
};

type SlotQueryRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  sort_index: number;
  bookings: { cancelled_at: string | null }[];
};

function toPublicEvent(event: {
  id: string;
  public_token: string;
  date: string;
  start_time: string;
  end_time: string;
  slots: SlotQueryRow[];
}): PublicEvent {
  const slots = [...event.slots]
    .sort((left, right) => left.sort_index - right.sort_index)
    .map((slot) => ({
      id: slot.id,
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      booked: slot.bookings.some((booking) => booking.cancelled_at === null),
    }));
  const bookedCount = slots.filter((slot) => slot.booked).length;

  return {
    id: event.id,
    token: event.public_token,
    date: event.date,
    startTime: event.start_time,
    endTime: event.end_time,
    status: eventStatus({
      date: event.date,
      startTime: event.start_time,
      slotCount: slots.length,
      bookedCount,
    }),
    slots,
  };
}

export async function getPublicEventByToken(
  token: string,
): Promise<PublicEvent | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("events")
    .select(
      "id, date, start_time, end_time, public_token, slots(id, starts_at, ends_at, sort_index, bookings(cancelled_at))",
    )
    .eq("public_token", token)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return toPublicEvent(data);
}

function normalizeBookingFields(input: {
  companyName: string;
  guestName: string;
  email: string;
}) {
  const companyName = input.companyName.trim();
  const guestName = input.guestName.trim();
  const email = input.email.trim().toLowerCase();

  if (!companyName || !guestName || !email) {
    throw new BookingError("会社名、名前、メールアドレスを入力してください。");
  }
  if (companyName.length > 100 || guestName.length > 80) {
    throw new BookingError("入力が長すぎます。");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BookingError("メールアドレスの形式が正しくありません。");
  }

  return { companyName, guestName, email };
}

function throwBookingSaveError(error: { code?: string; message: string; details?: string }) {
  const text = `${error.message} ${error.details ?? ""}`;
  if (error.code === "23505") {
    if (text.includes("bookings_one_email_per_event")) {
      throw new BookingError("このメールアドレスでは既に予約済みです。");
    }
    throw new BookingError("そのコマは直前に埋まりました。");
  }
  throw new BookingError("予約を保存できませんでした。");
}

export async function createBooking(input: {
  token: string;
  slotId: string;
  companyName: string;
  guestName: string;
  email: string;
}): Promise<{ id: string; eventId: string }> {
  const { companyName, guestName, email } = normalizeBookingFields(input);

  const event = await getPublicEventByToken(input.token);
  if (!event) {
    throw new BookingError("この予約ページは見つかりません。");
  }
  if (event.status === "closed") {
    throw new BookingError("予約の受付は終了しました。");
  }

  const slot = event.slots.find((item) => item.id === input.slotId);
  if (!slot) {
    throw new BookingError("コマを選択してください。");
  }
  if (slot.booked) {
    throw new BookingError("そのコマは直前に埋まりました。");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .insert({
      event_id: event.id,
      slot_id: slot.id,
      company_name: companyName,
      guest_name: guestName,
      email,
    })
    .select("id")
    .single();

  if (error) {
    throwBookingSaveError(error);
  }

  if (!data) {
    throw new BookingError("予約を保存できませんでした。");
  }

  const mailPayload = {
    date: event.date,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    companyName,
    guestName,
    email,
  };

  await notifyBookingSafely(() => sendBookingCreatedMails(mailPayload));
  await notifyBookingSafely(async () => {
    await scheduleReminderForBooking(data.id, mailPayload);
  });

  return { id: data.id, eventId: event.id };
}

export async function updateBooking(input: {
  bookingId: string;
  companyName: string;
  guestName: string;
  email: string;
}): Promise<{ eventId: string }> {
  const { companyName, guestName, email } = normalizeBookingFields(input);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .update({
      company_name: companyName,
      guest_name: guestName,
      email,
    })
    .eq("id", input.bookingId)
    .is("cancelled_at", null)
    .select("event_id")
    .maybeSingle();

  if (error) {
    throwBookingSaveError(error);
  }
  if (!data) {
    throw new BookingError("この予約はすでに取り消されています。");
  }

  return { eventId: data.event_id };
}

export async function createAdminBooking(input: {
  eventId: string;
  slotId: string;
  companyName: string;
  guestName: string;
  email: string;
}): Promise<{ id: string; eventId: string }> {
  const { companyName, guestName, email } = normalizeBookingFields(input);
  const admin = createSupabaseAdminClient();
  const { data: event, error: eventError } = await admin
    .from("events")
    .select("id, date, public_token")
    .eq("id", input.eventId)
    .maybeSingle();

  if (eventError) {
    throw eventError;
  }
  if (!event) {
    throw new BookingError("この開催は見つかりません。");
  }

  const { data: slot, error: slotError } = await admin
    .from("slots")
    .select("id, starts_at, ends_at, event_id")
    .eq("id", input.slotId)
    .eq("event_id", input.eventId)
    .maybeSingle();

  if (slotError) {
    throw slotError;
  }
  if (!slot) {
    throw new BookingError("コマを選択してください。");
  }

  const { data, error } = await admin
    .from("bookings")
    .insert({
      event_id: event.id,
      slot_id: slot.id,
      company_name: companyName,
      guest_name: guestName,
      email,
    })
    .select("id")
    .single();

  if (error) {
    throwBookingSaveError(error);
  }
  if (!data) {
    throw new BookingError("予約を保存できませんでした。");
  }

  const mailPayload = {
    date: event.date,
    startsAt: slot.starts_at,
    endsAt: slot.ends_at,
    companyName,
    guestName,
    email,
  };

  await notifyBookingSafely(() => sendBookingCreatedMails(mailPayload));
  await notifyBookingSafely(async () => {
    await scheduleReminderForBooking(data.id, mailPayload);
  });

  return { id: data.id, eventId: event.id };
}

export async function cancelBooking(bookingId: string): Promise<{
  eventId: string;
  token: string;
}> {
  const admin = createSupabaseAdminClient();
  const { data: booking, error: loadError } = await admin
    .from("bookings")
    .select(
      "id, cancelled_at, reminder_email_id, company_name, guest_name, email, event_id, events!inner(date, public_token), slots!inner(starts_at, ends_at)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }
  if (!booking || booking.cancelled_at) {
    throw new BookingError("この予約はすでに取り消されています。");
  }

  const { data: updated, error: updateError } = await admin
    .from("bookings")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .is("cancelled_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }
  if (!updated) {
    throw new BookingError("この予約はすでに取り消されています。");
  }

  await notifyBookingSafely(async () => {
    if (booking.reminder_email_id) {
      await cancelScheduledMail(booking.reminder_email_id);
    }
    await sendBookingCancelledMails({
      date: booking.events.date,
      startsAt: booking.slots.starts_at,
      endsAt: booking.slots.ends_at,
      companyName: booking.company_name,
      guestName: booking.guest_name,
      email: booking.email,
    });
  });

  return {
    eventId: booking.event_id,
    token: booking.events.public_token,
  };
}

function toMailPayload(booking: {
  company_name: string;
  guest_name: string;
  email: string;
  events: { date: string };
  slots: { starts_at: string; ends_at: string };
}): BookingMailPayload {
  return {
    date: booking.events.date,
    startsAt: booking.slots.starts_at,
    endsAt: booking.slots.ends_at,
    companyName: booking.company_name,
    guestName: booking.guest_name,
    email: booking.email,
  };
}

export async function sendSurveyForBooking(bookingId: string): Promise<{
  eventId: string;
}> {
  const admin = createSupabaseAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      "id, cancelled_at, company_name, guest_name, email, event_id, events!inner(date, survey_url), slots!inner(starts_at, ends_at)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!booking || booking.cancelled_at) {
    throw new BookingError("この予約はすでに取り消されています。");
  }
  const surveyUrl = booking.events.survey_url?.trim();
  if (!surveyUrl) {
    throw new BookingError("先にアンケートURLを保存してください。");
  }

  await sendSurveyRequestMail(toMailPayload(booking), surveyUrl);
  return { eventId: booking.event_id };
}

export async function sendSurveyForEvent(eventId: string): Promise<{
  sent: number;
  failed: number;
}> {
  const admin = createSupabaseAdminClient();
  const { data: event, error: eventError } = await admin
    .from("events")
    .select("id, date, survey_url")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw eventError;
  }
  if (!event) {
    throw new BookingError("この開催は見つかりません。");
  }
  const surveyUrl = event.survey_url?.trim();
  if (!surveyUrl) {
    throw new BookingError("先にアンケートURLを保存してください。");
  }

  const { data: bookings, error: bookingError } = await admin
    .from("bookings")
    .select(
      "id, cancelled_at, company_name, guest_name, email, slots!inner(starts_at, ends_at)",
    )
    .eq("event_id", eventId)
    .is("cancelled_at", null);

  if (bookingError) {
    throw bookingError;
  }

  const targets = bookings ?? [];
  if (targets.length === 0) {
    throw new BookingError("送信できる予約がありません。");
  }

  let sent = 0;
  let failed = 0;
  for (const booking of targets) {
    try {
      await sendSurveyRequestMail(
        {
          date: event.date,
          startsAt: booking.slots.starts_at,
          endsAt: booking.slots.ends_at,
          companyName: booking.company_name,
          guestName: booking.guest_name,
          email: booking.email,
        },
        surveyUrl,
      );
      sent += 1;
    } catch (reason) {
      console.error("アンケート案内の送信に失敗しました。", booking.id, reason);
      failed += 1;
    }
  }

  return { sent, failed };
}

async function notifyBookingSafely(send: () => Promise<void>) {
  try {
    await send();
  } catch (error) {
    console.error("メール送信に失敗しました。予約は保持します。", error);
  }
}

export async function getBookingReceipt(
  token: string,
  bookingId: string,
): Promise<BookingReceipt | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .select(
      "company_name, guest_name, email, cancelled_at, events!inner(date, public_token), slots!inner(starts_at, ends_at)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data || data.cancelled_at || data.events.public_token !== token) {
    return null;
  }

  return {
    token,
    date: data.events.date,
    startsAt: data.slots.starts_at,
    endsAt: data.slots.ends_at,
    companyName: data.company_name,
    guestName: data.guest_name,
    email: data.email,
  };
}
