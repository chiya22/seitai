"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BookingError, createBooking } from "@/lib/booking";

export type BookingFormState = {
  error: string;
} | null;

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createBookingAction(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const token = readString(formData, "token");
  const slotId = readString(formData, "slotId");
  const companyName = readString(formData, "companyName");
  const guestName = readString(formData, "guestName");
  const email = readString(formData, "email");

  if (!token) {
    return { error: "この予約ページは見つかりません。" };
  }

  let bookingId: string;
  let eventId: string;
  try {
    const booking = await createBooking({
      token,
      slotId,
      companyName,
      guestName,
      email,
    });
    bookingId = booking.id;
    eventId = booking.eventId;
  } catch (error) {
    if (error instanceof BookingError) {
      return { error: error.message };
    }
    return { error: "予約を保存できませんでした。" };
  }

  revalidatePath(`/r/${token}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/r/${token}/complete?b=${bookingId}`);
}
