"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { BookingError, cancelBooking } from "@/lib/booking";
import { createEvent, deleteEvent } from "@/lib/events";
import { GenerateSlotsError } from "@/lib/slots";

export type EventFormState = {
  error: string;
} | null;

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(formData: FormData, key: string) {
  const raw = readString(formData, key);
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  return Number(raw);
}

export async function createEventAction(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const date = readString(formData, "date");
  const startTime = readString(formData, "startTime");
  const endTime = readString(formData, "endTime");
  const slotMinutes = readInteger(formData, "slotMinutes");
  const breakMinutes = readInteger(formData, "breakMinutes");

  if (!date || !startTime || !endTime || slotMinutes === null || breakMinutes === null) {
    return { error: "すべての項目を正しく入力してください。" };
  }

  let id: string;
  try {
    id = await createEvent({
      date,
      startTime,
      endTime,
      slotMinutes,
      breakMinutes,
    });
  } catch (error) {
    if (error instanceof GenerateSlotsError) {
      return { error: error.message };
    }
    return { error: "開催を保存できませんでした。" };
  }

  revalidatePath("/admin");
  redirect(`/admin/events/${id}`);
}

export async function deleteEventAction(formData: FormData) {
  await requireAdmin();
  const id = readString(formData, "eventId");
  if (!id) {
    redirect("/admin");
  }
  await deleteEvent(id);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function cancelBookingAction(formData: FormData) {
  await requireAdmin();
  const bookingId = readString(formData, "bookingId");
  const eventId = readString(formData, "eventId");
  if (!bookingId || !eventId) {
    redirect("/admin");
  }

  try {
    const result = await cancelBooking(bookingId);
    revalidatePath("/admin");
    revalidatePath(`/admin/events/${result.eventId}`);
    revalidatePath(`/r/${result.token}`);
  } catch (error) {
    if (!(error instanceof BookingError)) {
      throw error;
    }
  }

  redirect(`/admin/events/${eventId}`);
}
