-- The unread feature is being introduced after Messaging MVP already has
-- production history. Treat all pre-existing conversations/messages as read so
-- users start from a clean zero badge instead of receiving retroactive alerts.

insert into public.conversation_reads (conversation_id, user_id, last_read_at)
select c.id, participant.user_id, now()
from public.conversations c
cross join lateral (
  values (c.owner_id), (c.requester_id)
) as participant(user_id)
on conflict (conversation_id, user_id)
do update set last_read_at = excluded.last_read_at;
