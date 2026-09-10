export const TOKYO_OFFSET = "+09:00";

export type SlotInput = {
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  breakMinutes: number;
};

export type GeneratedSlot = {
  startsAt: string;
  endsAt: string;
  sortIndex: number;
};

export class GenerateSlotsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerateSlotsError";
  }
}

function parseMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time.trim());
  if (!match) {
    throw new GenerateSlotsError("時刻の形式が正しくありません。");
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    throw new GenerateSlotsError("時刻の形式が正しくありません。");
  }
  return hours * 60 + minutes;
}

function toClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toTokyoIso(date: string, totalMinutes: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new GenerateSlotsError("日付の形式が正しくありません。");
  }
  return `${date}T${toClock(totalMinutes)}:00${TOKYO_OFFSET}`;
}

export function generateSlots(input: SlotInput): GeneratedSlot[] {
  if (!Number.isInteger(input.slotMinutes) || input.slotMinutes <= 0) {
    throw new GenerateSlotsError("1コマの時間は1分以上の整数にしてください。");
  }
  if (!Number.isInteger(input.breakMinutes) || input.breakMinutes < 0) {
    throw new GenerateSlotsError("休憩は0分以上の整数にしてください。");
  }

  const start = parseMinutes(input.startTime);
  const end = parseMinutes(input.endTime);
  if (end <= start) {
    throw new GenerateSlotsError("終了時刻は開始時刻より後にしてください。");
  }

  const slots: GeneratedSlot[] = [];
  let cursor = start;
  let sortIndex = 0;

  while (cursor + input.slotMinutes <= end) {
    const slotEnd = cursor + input.slotMinutes;
    slots.push({
      startsAt: toTokyoIso(input.date, cursor),
      endsAt: toTokyoIso(input.date, slotEnd),
      sortIndex,
    });
    cursor = slotEnd + input.breakMinutes;
    sortIndex += 1;
  }

  if (slots.length === 0) {
    throw new GenerateSlotsError("この時間帯では1コマも作れません。");
  }

  return slots;
}

export function formatSlotClock(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatSlotRange(startsAt: string, endsAt: string): string {
  return `${formatSlotClock(startsAt)}〜${formatSlotClock(endsAt)}`;
}
