-- Keep the public-safe collection projection synchronized with its private
-- source row. This protects future edit flows too: any legitimate change to
-- product/release/condition on collection_items automatically updates an
-- existing share in the same transaction.
--
-- SECURITY INVOKER is deliberate. The trigger runs with the caller's role and
-- therefore remains subject to collection_shares RLS; it is not a privilege
-- escalation path.

create or replace function public.sync_collection_share_projection()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.collection_shares
  set product_id = new.product_id,
      release_id = new.release_id,
      condition = new.condition,
      updated_at = now()
  where collection_item_id = new.id;

  return new;
end;
$$;

revoke all on function public.sync_collection_share_projection() from public;

DROP TRIGGER IF EXISTS sync_collection_share_projection_after_update
  ON public.collection_items;

create trigger sync_collection_share_projection_after_update
after update of product_id, release_id, condition
on public.collection_items
for each row
when (
  old.product_id is distinct from new.product_id
  or old.release_id is distinct from new.release_id
  or old.condition is distinct from new.condition
)
execute function public.sync_collection_share_projection();
