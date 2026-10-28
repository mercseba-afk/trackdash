-- Preserve transfer history while allowing the current owner to remove or
-- resell the live copy. No history, sale, user data or access policy is deleted.
set local lock_timeout = '3s';

alter table public.collection_item_transfers
  alter column buyer_collection_item_id drop not null;
alter table public.collection_item_transfers
  drop constraint collection_item_transfers_buyer_collection_item_id_fkey;
alter table public.collection_item_transfers
  add constraint collection_item_transfers_buyer_collection_item_id_fkey
  foreign key (buyer_collection_item_id) references public.collection_items(id)
  on delete set null;

comment on column public.collection_item_transfers.buyer_collection_item_id is
  'Live buyer copy reference; cleared if the owner deletes or resells that copy. The immutable sale and seller snapshot remain in the transfer history.';
