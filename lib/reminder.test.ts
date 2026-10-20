import assert from "node:assert/strict";
import { test } from "node:test";
import { reminderScheduledAt } from "./reminder";

test("開始の10分前をISOで返す", () => {
  const now = new Date("2026-10-21T03:40:00.000Z");
  assert.equal(
    reminderScheduledAt("2026-10-21T04:00:00.000Z", now),
    "2026-10-21T03:50:00.000Z",
  );
});

test("開始10分前を過ぎていたら送らない", () => {
  const now = new Date("2026-10-21T03:51:00.000Z");
  assert.equal(reminderScheduledAt("2026-10-21T04:00:00.000Z", now), null);
});

test("開始ちょうど10分前は送らない", () => {
  const now = new Date("2026-10-21T03:50:00.000Z");
  assert.equal(reminderScheduledAt("2026-10-21T04:00:00.000Z", now), null);
});

test("30日より先の送信予定は予約しない", () => {
  const now = new Date("2026-10-20T00:00:00.000Z");
  const startsAt = new Date(
    now.getTime() + 31 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000,
  ).toISOString();
  assert.equal(reminderScheduledAt(startsAt, now), null);
});

test("30日以内なら予約できる", () => {
  const now = new Date("2026-10-20T00:00:00.000Z");
  const startsAt = new Date(
    now.getTime() + 29 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000,
  ).toISOString();
  assert.equal(
    reminderScheduledAt(startsAt, now),
    new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000).toISOString(),
  );
});
