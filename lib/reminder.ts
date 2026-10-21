import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  cancelScheduledMail,
  scheduleBookingReminderMail,
  type BookingMailPayload,
} from "@/lib/mail";

export const REMINDER_LEAD_MS = 5 * 60 * 1000;
export const RESEND_SCHEDULE_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;

export function reminderScheduledAt(
  startsAt: string,
  now = new Date(),
): string | null {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const scheduled = new Date(start.getTime() - REMINDER_LEAD_MS);
  if (scheduled <= now) {
    return null;
  }
  if (scheduled.getTime() - now.getTime() > RESEND_SCHEDULE_LIMIT_MS) {
    return null;
  }

  return scheduled.toISOString();
}

export async function scheduleReminderForBooking(
  bookingId: string,
  payload: BookingMailPayload,
): Promise<string | null> {
  const scheduledAt = reminderScheduledAt(payload.startsAt);
  if (!scheduledAt) {
    return null;
  }

  const emailId = await scheduleBookingReminderMail(payload, scheduledAt);
  if (!emailId) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({ reminder_email_id: emailId })
    .eq("id", bookingId);

  if (error) {
    await cancelScheduledMail(emailId);
    throw error;
  }

  return emailId;
}

export async function cancelRemindersForEvent(eventId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .select("reminder_email_id")
    .eq("event_id", eventId)
    .not("reminder_email_id", "is", null);

  if (error) {
    throw error;
  }

  const ids = (data ?? [])
    .map((row) => row.reminder_email_id)
    .filter((id): id is string => Boolean(id));

  await Promise.all(ids.map((id) => cancelScheduledMail(id)));
}

export async function backfillBookingReminders(): Promise<{
  scheduled: number;
  skipped: number;
  failed: number;
}> {
  return syncBookingReminders({ replaceExisting: false });
}

export async function resyncBookingReminders(): Promise<{
  scheduled: number;
  skipped: number;
  failed: number;
}> {
  return syncBookingReminders({ replaceExisting: true });
}

async function syncBookingReminders(input: { replaceExisting: boolean }): Promise<{
  scheduled: number;
  skipped: number;
  failed: number;
}> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("bookings")
    .select(
      "id, company_name, guest_name, email, reminder_email_id, cancelled_at, events!inner(date), slots!inner(starts_at, ends_at)",
    )
    .is("cancelled_at", null);

  if (!input.replaceExisting) {
    query = query.is("reminder_email_id", null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  let scheduled = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of data ?? []) {
    const payload: BookingMailPayload = {
      date: row.events.date,
      startsAt: row.slots.starts_at,
      endsAt: row.slots.ends_at,
      companyName: row.company_name,
      guestName: row.guest_name,
      email: row.email,
    };

    if (!reminderScheduledAt(payload.startsAt)) {
      skipped += 1;
      continue;
    }

    try {
      if (row.reminder_email_id) {
        await cancelScheduledMail(row.reminder_email_id);
      }
      const emailId = await scheduleReminderForBooking(row.id, payload);
      if (emailId) {
        scheduled += 1;
      } else {
        skipped += 1;
      }
    } catch (reason) {
      console.error("リマインドの予約送信に失敗しました。", row.id, reason);
      failed += 1;
    }
  }

  return { scheduled, skipped, failed };
}
