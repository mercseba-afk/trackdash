-- Cover messaging foreign keys that are not already the leading columns of a
-- useful index. Keeps delete/join behavior predictable as conversations grow.

create index if not exists idx_conversations_share
  on public.conversations(collection_share_id);
create index if not exists idx_conversations_product
  on public.conversations(product_id);
create index if not exists idx_conversations_release
  on public.conversations(release_id);
create index if not exists idx_messages_sender
  on public.messages(sender_id);
