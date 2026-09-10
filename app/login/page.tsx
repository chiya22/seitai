import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminUser } from "@/lib/auth";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "管理者ログイン",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/admin");
  }

  const canSignup = !(await hasAdminUser());

  return (
    <AuthCard title="管理者ログイン">
      <LoginForm />
      {canSignup ? (
        <p className="mt-6 text-sm text-stone-600">
          初回は
          <Link href="/signup" className="mx-1 font-medium text-stone-900 underline">
            アカウント作成
          </Link>
          から登録してください。
        </p>
      ) : null}
    </AuthCard>
  );
}
