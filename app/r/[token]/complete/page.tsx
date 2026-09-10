import type { Metadata } from "next";
import { getBookingReceipt } from "@/lib/booking";
import { formatEventDate } from "@/lib/time";
import { formatSlotRange } from "@/lib/slots";

export const metadata: Metadata = {
  title: "予約完了",
};

export default async function BookingCompletePage({
  params,
  searchParams,
}: PageProps<"/r/[token]/complete">) {
  const { token } = await params;
  const query = await searchParams;
  const bookingId = typeof query.b === "string" ? query.b : "";
  const receipt =
    bookingId.length > 0 ? await getBookingReceipt(token, bookingId) : null;

  if (!receipt) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16 pb-[max(4rem,env(safe-area-inset-bottom))]">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          予約情報を表示できません
        </h1>
        <p className="mt-4 leading-relaxed text-stone-600">
          予約が完了している場合は、入力したメールアドレスの受信箱をご確認ください。
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16 pb-[max(4rem,env(safe-area-inset-bottom))]">
      <p className="text-sm text-stone-500">ちょこっと整体 予約システム</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
        予約を受け付けました
      </h1>
      <dl className="mt-8 space-y-3 text-sm">
        <div>
          <dt className="text-stone-500">日時</dt>
          <dd className="mt-1 text-stone-900">
            {formatEventDate(receipt.date)}
            <span className="mt-1 block">
              {formatSlotRange(receipt.startsAt, receipt.endsAt)}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">会社名</dt>
          <dd className="mt-1 text-stone-900">{receipt.companyName}</dd>
        </div>
        <div>
          <dt className="text-stone-500">名前</dt>
          <dd className="mt-1 text-stone-900">{receipt.guestName}</dd>
        </div>
        <div>
          <dt className="text-stone-500">メールアドレス</dt>
          <dd className="mt-1 break-all text-stone-900">{receipt.email}</dd>
        </div>
      </dl>
      <p className="mt-8 leading-relaxed text-stone-600">
        確認のメールをお送りしました。届かない場合は、管理者へご連絡ください。
      </p>
    </main>
  );
}
