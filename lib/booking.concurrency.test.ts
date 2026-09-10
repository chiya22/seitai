import assert from "node:assert/strict";
import { test } from "node:test";
import "./test-setup";
import {
  BookingError,
  createBooking,
  getPublicEventByToken,
} from "./booking";
import { createEvent, deleteEvent, getEventDetail } from "./events";

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function withEvent<T>(run: (input: {
  token: string;
  slotIds: string[];
}) => Promise<T>): Promise<T> {
  const eventId = await createEvent({
    date: "2026-12-15",
    startTime: "10:00",
    endTime: "11:00",
    slotMinutes: 20,
    breakMinutes: 0,
  });
  try {
    const detail = await getEventDetail(eventId);
    if (!detail) {
      throw new Error("開催詳細がありません");
    }
    const event = await getPublicEventByToken(detail.public_token);
    if (!event || event.slots.length < 2) {
      throw new Error("検証用の空きコマが足りません");
    }
    return await run({
      token: event.token,
      slotIds: event.slots.map((slot) => slot.id),
    });
  } finally {
    await deleteEvent(eventId);
  }
}

test(
  "同じコマへの同時予約は1件だけ成功する",
  { skip: !configured, timeout: 30_000 },
  async () => {
    await withEvent(async ({ token, slotIds }) => {
      const stamp = Date.now();
      const results = await Promise.allSettled([
        createBooking({
          token,
          slotId: slotIds[0],
          companyName: "T5レースA",
          guestName: "同時送信A",
          email: `t5-race-a-${stamp}@example.com`,
        }),
        createBooking({
          token,
          slotId: slotIds[0],
          companyName: "T5レースB",
          guestName: "同時送信B",
          email: `t5-race-b-${stamp}@example.com`,
        }),
      ]);

      const ok = results.filter((result) => result.status === "fulfilled");
      const ng = results.filter((result) => result.status === "rejected");
      assert.equal(ok.length, 1);
      assert.equal(ng.length, 1);
      assert.ok(ng[0].status === "rejected");
      assert.ok(ng[0].reason instanceof BookingError);
      assert.equal(ng[0].reason.message, "そのコマは直前に埋まりました。");

      const event = await getPublicEventByToken(token);
      assert.equal(event?.slots.filter((slot) => slot.booked).length, 1);
    });
  },
);

test(
  "同一開催の同一メールは2件目が失敗する",
  { skip: !configured, timeout: 30_000 },
  async () => {
    await withEvent(async ({ token, slotIds }) => {
      const stamp = Date.now();
      await createBooking({
        token,
        slotId: slotIds[0],
        companyName: "T5同一メール",
        guestName: "先着",
        email: `t5-dup-${stamp}@example.com`,
      });

      await assert.rejects(
        () =>
          createBooking({
            token,
            slotId: slotIds[1],
            companyName: "T5同一メール",
            guestName: "後着",
            email: `T5-DUP-${stamp}@EXAMPLE.COM`,
          }),
        (error: unknown) => {
          assert.ok(error instanceof BookingError);
          assert.equal(
            error.message,
            "このメールアドレスでは既に予約済みです。",
          );
          return true;
        },
      );
    });
  },
);
