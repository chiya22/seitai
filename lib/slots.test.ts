import assert from "node:assert/strict";
import { test } from "node:test";
import { GenerateSlotsError, generateSlots } from "./slots";

test("10:00-12:00 / 20分 / 休憩5分 は仕様どおり5コマ", () => {
  const slots = generateSlots({
    date: "2026-09-20",
    startTime: "10:00",
    endTime: "12:00",
    slotMinutes: 20,
    breakMinutes: 5,
  });

  assert.equal(slots.length, 5);
  assert.deepEqual(
    slots.map((slot) => [slot.startsAt, slot.endsAt, slot.sortIndex]),
    [
      ["2026-09-20T10:00:00+09:00", "2026-09-20T10:20:00+09:00", 0],
      ["2026-09-20T10:25:00+09:00", "2026-09-20T10:45:00+09:00", 1],
      ["2026-09-20T10:50:00+09:00", "2026-09-20T11:10:00+09:00", 2],
      ["2026-09-20T11:15:00+09:00", "2026-09-20T11:35:00+09:00", 3],
      ["2026-09-20T11:40:00+09:00", "2026-09-20T12:00:00+09:00", 4],
    ],
  );
});

test("終了時刻ちょうどに終わるコマは作る", () => {
  const slots = generateSlots({
    date: "2026-09-20",
    startTime: "10:00",
    endTime: "10:20",
    slotMinutes: 20,
    breakMinutes: 5,
  });
  assert.equal(slots.length, 1);
  assert.equal(slots[0].startsAt, "2026-09-20T10:00:00+09:00");
  assert.equal(slots[0].endsAt, "2026-09-20T10:20:00+09:00");
});

test("はみ出すコマは作らない", () => {
  const slots = generateSlots({
    date: "2026-09-20",
    startTime: "10:00",
    endTime: "10:30",
    slotMinutes: 20,
    breakMinutes: 5,
  });
  assert.equal(slots.length, 1);
});

test("休憩0分なら連続する", () => {
  const slots = generateSlots({
    date: "2026-09-20",
    startTime: "10:00:00",
    endTime: "11:00",
    slotMinutes: 20,
    breakMinutes: 0,
  });
  assert.deepEqual(
    slots.map((slot) => slot.startsAt),
    [
      "2026-09-20T10:00:00+09:00",
      "2026-09-20T10:20:00+09:00",
      "2026-09-20T10:40:00+09:00",
    ],
  );
});

test("1コマも入らない入力はエラー", () => {
  assert.throws(
    () =>
      generateSlots({
        date: "2026-09-20",
        startTime: "10:00",
        endTime: "10:15",
        slotMinutes: 20,
        breakMinutes: 5,
      }),
    GenerateSlotsError,
  );
});

test("終了が開始以前はエラー", () => {
  assert.throws(
    () =>
      generateSlots({
        date: "2026-09-20",
        startTime: "12:00",
        endTime: "10:00",
        slotMinutes: 20,
        breakMinutes: 5,
      }),
    GenerateSlotsError,
  );
});
