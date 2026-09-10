import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getAdminNotifyEmail() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  if (error || data.users.length === 0) {
    return null;
  }
  return data.users[0]?.email ?? null;
}
