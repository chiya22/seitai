function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`);
  }
  return value;
}

export function getSupabasePublicEnv() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseServiceRoleKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

export function getResendEnv() {
  return {
    apiKey: required("RESEND_API_KEY"),
    from: required("MAIL_FROM"),
  };
}

export function getAppUrl() {
  return required("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
}
