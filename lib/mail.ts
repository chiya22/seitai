import { Resend } from "resend";
import { getAdminNotifyEmail } from "@/lib/admin-email";
import { getResendEnv } from "@/lib/env";
import { formatSlotRange } from "@/lib/slots";
import { formatEventDate } from "@/lib/time";

let resend: Resend | null = null;

export function getResend() {
  if (!resend) {
    const { apiKey } = getResendEnv();
    resend = new Resend(apiKey);
  }
  return resend;
}

export function getMailFrom() {
  return getResendEnv().from;
}

export type BookingMailPayload = {
  date: string;
  startsAt: string;
  endsAt: string;
  companyName: string;
  guestName: string;
  email: string;
};

function bookingLines(payload: BookingMailPayload) {
  return [
    `日時: ${formatEventDate(payload.date)} ${formatSlotRange(payload.startsAt, payload.endsAt)}`,
    `会社名: ${payload.companyName}`,
    `名前: ${payload.guestName}`,
  ].join("\n");
}

async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  scheduledAt?: string;
  bcc?: string;
}): Promise<string> {
  const { data, error } = await getResend().emails.send({
    from: getMailFrom(),
    to: input.to,
    bcc: input.bcc,
    subject: input.subject,
    text: input.text,
    scheduledAt: input.scheduledAt,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data?.id) {
    throw new Error("メールIDを取得できませんでした。");
  }
  return data.id;
}

async function adminBccFor(guestEmail: string): Promise<string | undefined> {
  const adminEmail = await getAdminNotifyEmail();
  if (!adminEmail) {
    console.error("管理者メールアドレスが取得できないため、管理者通知を送れませんでした。");
    return undefined;
  }
  if (adminEmail.toLowerCase() === guestEmail.toLowerCase()) {
    return undefined;
  }
  return adminEmail;
}

async function sendGuestMail(input: {
  to: string;
  subject: string;
  text: string;
  scheduledAt?: string;
}): Promise<string> {
  const bcc = await adminBccFor(input.to);
  return sendMail({
    ...input,
    bcc,
  });
}

export async function sendBookingCreatedMails(payload: BookingMailPayload) {
  if (process.env.SKIP_MAIL === "1") {
    return;
  }
  const summary = bookingLines(payload);
  await sendGuestMail({
    to: payload.email,
    subject: "【ちょこっと整体 予約】予約が完了しました",
    text: `予約を受け付けました。\n\n${summary}\n\n当日は時間に余裕をもってお越しください。\n\n▼施術前カウンセリングフォーム\n当日、安全に施術を行うため、事前にお身体の状況を確認させていただければと思っております。\n下記URLより初回カウンセリングフォームへのご回答をお願いいたします。\nhttps://forms.gle/f17Ch9tAZfSY53LL7`,
  });
}

export async function scheduleBookingReminderMail(
  payload: BookingMailPayload,
  scheduledAt: string,
): Promise<string | null> {
  if (process.env.SKIP_MAIL === "1") {
    return null;
  }
  const summary = bookingLines(payload);
  return sendGuestMail({
    to: payload.email,
    subject: "【ちょこっと整体 予約】まもなく開始時間です",
    text: `まもなく予約の時間です。\n\n${summary}\n\n時間に余裕をもってお越しください。`,
    scheduledAt,
  });
}

export async function cancelScheduledMail(emailId: string): Promise<void> {
  if (process.env.SKIP_MAIL === "1" || !emailId) {
    return;
  }
  const { error } = await getResend().emails.cancel(emailId);
  if (error) {
    console.error("予約リマインドメールのキャンセルに失敗しました。", error.message);
  }
}

export async function sendSurveyRequestMail(
  payload: BookingMailPayload,
  surveyUrl: string,
) {
  if (process.env.SKIP_MAIL === "1") {
    return;
  }
  const summary = bookingLines(payload);
  await sendGuestMail({
    to: payload.email,
    subject: "【ちょこっと整体 予約】施術後アンケートのお願い",
    text: `イベントにご参加いただきありがとうございました。\n\nお身体の様子やご感想をお伺いしたく、下記のアンケートへのご回答をお願いいたします。\n\n▼施術後アンケート\n${surveyUrl}\n\n${summary}\n\nお支払につきましては、毎月の施設利用料と一緒に請求させていただきます。\n毎月の請求と分けて支払いたい場合は、1階コンシェルジュまでお越しください。`,
  });
}

export async function sendBookingCancelledMails(payload: BookingMailPayload) {
  if (process.env.SKIP_MAIL === "1") {
    return;
  }
  const summary = bookingLines(payload);
  await sendGuestMail({
    to: payload.email,
    subject: "【ちょこっと整体 予約】予約が取り消されました",
    text: `管理者により、次の予約が取り消されました。\n\n${summary}\n\nご不明点は管理者へご連絡ください。`,
  });
}
