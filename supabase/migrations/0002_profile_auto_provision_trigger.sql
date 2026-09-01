-- Auto-provisions a `profiles` row whenever Supabase Auth creates a new
-- `auth.users` row (sign-up), so `profiles.id` never lags behind
-- `auth.users.id` -- see lib/db/schema/profiles.ts, which deferred this
-- exact trigger to "the future auth step". This is that step.
--
-- Prefers a username the person chose at sign-up (passed as
-- `options.data.username` to supabase.auth.signUp(), stored by Supabase as
-- auth.users.raw_user_meta_data -- see lib/store.tsx). Falls back to one
-- derived from the email local-part + a short id suffix, both when no
-- username was supplied AND if the chosen one collides with an existing
-- one (profiles.username is UNIQUE) -- sign-up must never fail just
-- because a display name was taken; the fallback guarantees the insert
-- succeeds, and renaming is a future profile-editing concern, not this
-- one's.
--
-- SECURITY DEFINER + a fixed search_path is the standard, necessary
-- hardening for this kind of trigger function (runs with the privileges of
-- whoever owns it, and a fixed search_path avoids search_path-hijacking).
-- This is also what lets the insert succeed at all despite RLS on
-- `profiles`: the function owner (the migration role) is exempt from RLS
-- by default since the table was not created with FORCE ROW LEVEL
-- SECURITY.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_username text;
  chosen_username text;
begin
  fallback_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if fallback_username is null or fallback_username = '' then
    fallback_username := 'collector';
  end if;
  fallback_username := fallback_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6);

  chosen_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  if chosen_username is null then
    chosen_username := fallback_username;
  end if;

  begin
    insert into public.profiles (id, username, country)
    values (new.id, chosen_username, nullif(new.raw_user_meta_data ->> 'country', ''));
  exception when unique_violation then
    insert into public.profiles (id, username, country)
    values (new.id, fallback_username, nullif(new.raw_user_meta_data ->> 'country', ''))
    on conflict (id) do nothing;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
