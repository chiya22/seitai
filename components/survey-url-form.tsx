"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  saveSurveyUrlAction,
  type SurveyUrlFormState,
} from "@/app/admin/events/actions";
import { fieldClassName } from "@/components/auth-card";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 px-4 text-sm text-stone-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "保存中…" : "保存"}
    </button>
  );
}

export function SurveyUrlForm({
  eventId,
  surveyUrl,
}: {
  eventId: string;
  surveyUrl: string | null;
}) {
  const [state, action] = useActionState<SurveyUrlFormState, FormData>(
    saveSurveyUrlAction,
    null,
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className={`${fieldClassName} mt-0 min-w-0 flex-1`}
          type="url"
          name="surveyUrl"
          inputMode="url"
          placeholder="https://forms.gle/…"
          defaultValue={surveyUrl ?? ""}
        />
        <SaveButton />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.saved ? (
        <p className="text-sm text-emerald-800">アンケートURLを保存しました。</p>
      ) : null}
    </form>
  );
}
