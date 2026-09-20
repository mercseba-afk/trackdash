-- TrackDash Admin Console foundations.
-- Secure server-side admin authorization, account plan/subscription scaffolding,
-- and privacy-friendly aggregate page-view counters.
--
-- IMPORTANT:
-- - merc.seba@gmail.com is used only once to bootstrap the matching auth user
--   into app_admins. Runtime authorization always checks the authenticated UUID.
-- - Billing fields are structural only. No payment provider is activated here.
-- - Traffic data is aggregate only: no IP address, user agent, or user ID.

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  label text,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
revoke all on table public.app_admins from public, anon, authenticated;
grant select, insert, update, delete on table public.app_admins to service_role;

insert into public.app_admins (user_id, label)
select id, 'Sebastiano'
from auth.users
where lower(email) = lower('merc.seba@gmail.com')
on conflict (user_id) do nothing;

create table if not exists public.account_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free'
    check (plan in ('free', 'pro')),
  subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  billing_provider text not null default 'none'
    check (billing_provider in ('none', 'manual', 'stripe', 'app_store', 'play_store')),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  payment_status text not null default 'not_applicable'
    check (payment_status in ('not_applicable', 'pending', 'paid', 'failed', 'refunded')),
  last_payment_at timestamptz,
  next_payment_at timestamptz,
  last_payment_amount numeric(10,2),
  last_payment_currency text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (last_payment_amount is null or last_payment_amount >= 0),
  check (last_payment_currency is null or last_payment_currency in ('EUR', 'USD', 'JPY', 'GBP'))
);

create index if not exists idx_account_subscriptions_plan_status
  on public.account_subscriptions (plan, subscription_status);

alter table public.account_subscriptions enable row level security;
revoke all on table public.account_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on table public.account_subscriptions to service_role;

insert into public.account_subscriptions (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.handle_new_account_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.account_subscriptions (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_account_subscription() from public, anon, authenticated;
grant execute on function public.handle_new_account_subscription() to service_role;

drop trigger if exists on_auth_user_create_subscription on auth.users;
create trigger on_auth_user_create_subscription
  after insert on auth.users
  for each row
  execute function public.handle_new_account_subscription();

create table if not exists public.app_traffic_daily (
  day date not null default current_date,
  path text not null,
  signed_in boolean not null default false,
  page_views integer not null default 0 check (page_views >= 0),
  primary key (day, path, signed_in),
  check (char_length(path) between 1 and 180)
);

create index if not exists idx_app_traffic_daily_day
  on public.app_traffic_daily (day desc);

alter table public.app_traffic_daily enable row level security;
revoke all on table public.app_traffic_daily from public, anon, authenticated;
grant select, insert, update, delete on table public.app_traffic_daily to service_role;

create or replace function public.trackdash_record_page_view(
  p_path text,
  p_signed_in boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  v_path := left(split_part(split_part(trim(coalesce(p_path, '')), '?', 1), '#', 1), 180);

  if v_path = '' or left(v_path, 1) <> '/' then
    return;
  end if;

  -- Never include the private admin console in product-usage metrics.
  if v_path = '/admin' or v_path like '/admin/%' then
    return;
  end if;

  insert into public.app_traffic_daily (day, path, signed_in, page_views)
  values (current_date, v_path, coalesce(p_signed_in, false), 1)
  on conflict (day, path, signed_in)
  do update set page_views = public.app_traffic_daily.page_views + 1;
end;
$$;

revoke all on function public.trackdash_record_page_view(text, boolean) from public, anon, authenticated;
grant execute on function public.trackdash_record_page_view(text, boolean) to service_role;
