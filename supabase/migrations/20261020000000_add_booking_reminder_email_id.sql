-- 開始10分前リマインド（Resend 予約送信）のメールID
alter table public.bookings
  add column reminder_email_id text;
