-- A conversation keeps its Product/Release/user snapshots if the owner later
-- makes the item private. ON DELETE SET NULL must therefore be allowed to
-- detach collection_share_id without permitting callers to rewrite identity.

revoke update (responded_at) on table public.conversations from authenticated;

create or replace function public.guard_conversation_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  safe_share_unlink boolean :=
    old.collection_share_id is not null and new.collection_share_id is null;
begin
  if (new.collection_share_id is distinct from old.collection_share_id and not safe_share_unlink)
     or new.product_id is distinct from old.product_id
     or new.release_id is distinct from old.release_id
     or new.owner_id is distinct from old.owner_id
     or new.requester_id is distinct from old.requester_id
     or new.owner_username is distinct from old.owner_username
     or new.requester_username is distinct from old.requester_username
     or new.request_message is distinct from old.request_message
     or new.created_at is distinct from old.created_at then
    raise exception 'Conversation identity and request context are immutable';
  end if;

  if old.status <> 'pending' and new.status is distinct from old.status then
    raise exception 'Conversation status is final once answered';
  end if;

  if old.status = 'pending' and new.status not in ('pending', 'accepted', 'declined') then
    raise exception 'Invalid conversation status transition';
  end if;

  if new.status is distinct from old.status and new.status in ('accepted', 'declined') then
    new.responded_at := now();
  elsif new.responded_at is distinct from old.responded_at then
    raise exception 'responded_at is managed by the conversation status transition';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.guard_conversation_update() from public;
grant execute on function public.guard_conversation_update() to authenticated;
