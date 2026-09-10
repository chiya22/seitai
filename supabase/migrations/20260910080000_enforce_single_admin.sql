-- 管理者は1人だけ。Auth API からの直接登録も拒否する。

create or replace function public.reject_extra_auth_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(829201);
  if exists (select 1 from auth.users) then
    raise exception 'このシステムは管理者を1人だけ登録できます';
  end if;
  return NEW;
end;
$$;

drop trigger if exists reject_extra_auth_users on auth.users;

create trigger reject_extra_auth_users
before insert on auth.users
for each row
execute function public.reject_extra_auth_users();
