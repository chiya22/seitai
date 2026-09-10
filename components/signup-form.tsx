"use client";

import { useActionState } from "react";
import {
  signupAction,
  type AuthFormState,
} from "@/app/auth/actions";
import {
  fieldClassName,
  primaryButtonClassName,
} from "@/components/auth-card";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signupAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm text-stone-700">
        メールアドレス
        <input
          className={fieldClassName}
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="block text-sm text-stone-700">
        パスワード
        <input
          className={fieldClassName}
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label className="block text-sm text-stone-700">
        パスワード（確認）
        <input
          className={fieldClassName}
          type="password"
          name="passwordConfirm"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      {state?.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className={primaryButtonClassName}
        type="submit"
        disabled={pending}
      >
        {pending ? "登録中…" : "アカウントを作成"}
      </button>
    </form>
  );
}
