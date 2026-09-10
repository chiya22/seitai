"use client";

import { useActionState } from "react";
import {
  loginAction,
  type AuthFormState,
} from "@/app/auth/actions";
import {
  fieldClassName,
  primaryButtonClassName,
} from "@/components/auth-card";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
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
          autoComplete="current-password"
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
        {pending ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
