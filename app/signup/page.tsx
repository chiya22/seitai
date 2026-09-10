import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminUser } from "@/lib/auth";
import { AuthCard } from "@/components/auth-card";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = {
  title: "初回登録",
};

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/admin");
  }

  if (await hasAdminUser()) {
    redirect("/login");
  }

  return (
    <AuthCard title="初回登録">
      <p className="mb-6 text-sm leading-relaxed text-stone-600">
        管理者アカウントを1つだけ作成できます。
      </p>
      <SignupForm />
      <p className="mt-6 text-sm text-stone-600">
        すでに登録済みの方は
        <Link href="/login" className="mx-1 font-medium text-stone-900 underline">
          ログイン
        </Link>
        へ。
      </p>
    </AuthCard>
  );
}
