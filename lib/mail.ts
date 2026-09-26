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
}) {
  const { error } = await getResend().emails.send({
    from: getMailFrom(),
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function sendToGuestAndAdmin(input: {
  guest: { to: string; subject: string; text: string };
  admin: { subject: string; text: string };
}) {
  const adminEmail = await getAdminNotifyEmail();
  const jobs = [sendMail(input.guest)];
  if (adminEmail) {
    jobs.push(
      sendMail({
        to: adminEmail,
        subject: input.admin.subject,
        text: input.admin.text,
      }),
    );
  } else {
    console.error("管理者メールアドレスが取得できないため、管理者通知を送れませんでした。");
  }

  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("メール送信に失敗しました。", result.reason);
    }
  }
}

export async function sendBookingCreatedMails(payload: BookingMailPayload) {
  if (process.env.SKIP_MAIL === "1") {
    return;
  }
  const summary = bookingLines(payload);
  await sendToGuestAndAdmin({
    guest: {
      to: payload.email,
      subject: "【ちょこっと整体 予約】予約が完了しました",
      text: `予約を受け付けました。\n\n${summary}\n\n当日は時間に余裕をもってお越しください。\n\n▼施術前カウンセリングフォーム\n当日、安全に施術を行うため、事前にお身体の状況を確認させていただければと思っております。\n下記URLより初回カウンセリングフォームへのご回答をお願いいたします。\nhttps://forms.gle/f17Ch9tAZfSY53LL7`,
    },
    admin: {
      subject: "【ちょこっと整体 予約】新しい予約があります",
      text: `新しい予約が入りました。\n\n${summary}\nメールアドレス: ${payload.email}`,
    },
  });
}

export async function sendBookingCancelledMails(payload: BookingMailPayload) {
  if (process.env.SKIP_MAIL === "1") {
    return;
  }
  const summary = bookingLines(payload);
  await sendToGuestAndAdmin({
    guest: {
      to: payload.email,
      subject: "【ちょこっと整体 予約】予約が取り消されました",
      text: `管理者により、次の予約が取り消されました。\n\n${summary}\n\nご不明点は管理者へご連絡ください。`,
    },
    admin: {
      subject: "【ちょこっと整体 予約】予約を取り消しました",
      text: `次の予約を取り消しました。コマは再び予約できます。\n\n${summary}\nメールアドレス: ${payload.email}`,
    },
  });
}
