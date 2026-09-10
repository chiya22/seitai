export function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
}

export function parsePostgresTime(value: string): string {
  return value.slice(0, 5);
}

export function eventStartDateTime(date: string, startTime: string): Date {
  return new Date(`${date}T${parsePostgresTime(startTime)}:00+09:00`);
}

export function isBeforeEventStart(
  date: string,
  startTime: string,
  now = new Date(),
): boolean {
  return now < eventStartDateTime(date, startTime);
}

export function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${parsePostgresTime(startTime)}〜${parsePostgresTime(endTime)}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export type EventStatus = "open" | "full" | "closed";

export function eventStatus(input: {
  date: string;
  startTime: string;
  slotCount: number;
  bookedCount: number;
  now?: Date;
}): EventStatus {
  if (!isBeforeEventStart(input.date, input.startTime, input.now)) {
    return "closed";
  }
  if (input.slotCount > 0 && input.bookedCount >= input.slotCount) {
    return "full";
  }
  return "open";
}

export function eventStatusLabel(status: EventStatus): string {
  if (status === "open") return "受付中";
  if (status === "full") return "満席";
  return "終了";
}
