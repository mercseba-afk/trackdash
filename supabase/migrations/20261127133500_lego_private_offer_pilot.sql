create policy lego_private_offer_pilot_share on public.collection_shares
as restrictive for select to authenticated
using (
  id <> 'f24f5399-17e2-4662-992d-d221bd747ef8'::uuid or exists (
    select 1 from public.conversations c
    where c.id = '129fcf3e-25a2-4bcd-8ff9-5ceebbcc3822'::uuid
      and (select auth.uid()) in (c.owner_id, c.requester_id)
  )
);

create function public.guard_lego_offer_pilot() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'marketplace_sales' then
    raise exception 'Le offerte di prova LEGO non possono diventare vendite registrate';
  end if;
  if not exists (
    select 1 from public.conversations c, public.conversations pilot
    where c.id = new.conversation_id
      and pilot.id = '129fcf3e-25a2-4bcd-8ff9-5ceebbcc3822'::uuid
      and c.owner_id = pilot.owner_id and c.requester_id = pilot.requester_id
      and new.creator_id in (pilot.owner_id, pilot.requester_id)
  ) then
    raise exception 'Offerta LEGO riservata ai partecipanti al collaudo';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_lego_offer_pilot() from public, anon, authenticated;

create trigger lego_private_offer_pilot_guard before insert on public.marketplace_offers
for each row when (new.release_id = 'fa1b971e-e49e-5b98-84b0-25f79c45ec38'::uuid)
execute function public.guard_lego_offer_pilot();

create trigger lego_private_sale_pilot_guard before insert on public.marketplace_sales
for each row when (new.release_id = 'fa1b971e-e49e-5b98-84b0-25f79c45ec38'::uuid)
execute function public.guard_lego_offer_pilot();

insert into public.collector_profiles(user_id, username)
select owner_id, owner_username from public.conversations where id = '129fcf3e-25a2-4bcd-8ff9-5ceebbcc3822'
on conflict (user_id) do nothing;

insert into public.collection_items(id,user_id,product_id,release_id,condition)
select '786c024c-ad92-4c0b-9743-0a6237346248',owner_id,product_id,release_id,'Sealed'
from public.conversations where id = '129fcf3e-25a2-4bcd-8ff9-5ceebbcc3822';

insert into public.collection_shares(id,collection_item_id,user_id,product_id,release_id,condition,share_mode,asking_price,asking_currency)
select 'f24f5399-17e2-4662-992d-d221bd747ef8',id,user_id,product_id,release_id,condition,'open_to_offers',25,'EUR'
from public.collection_items where id = '786c024c-ad92-4c0b-9743-0a6237346248';
