# Messaging MVP

Flow: `Open to offers Collection Share -> pending request -> owner Accept/Decline -> accepted conversation -> messages`.

Security/privacy invariants:

- Messaging never reads `collection_items`; conversation context is Product + exact Release + public Collection Share.
- Only the requester can create a request, and only against a real `open_to_offers` share.
- Only the share owner can Accept/Decline a pending request.
- Messages can be inserted only by conversation participants after acceptance.
- Blocking either direction prevents acceptance/new messages while preserving existing history.
- `anon` has no grants on messaging tables.
- Conversation identity/context is immutable after creation; only the owner-controlled status can transition from pending.
- If a share is later removed, `collection_share_id` may safely become NULL while Product/Release/user snapshots preserve conversation history.
- Realtime publishes only `public.messages`; the internal Supabase `realtime` schema is never modified.

Current MVP deliberately excludes payments, listings, offers with numeric prices, unread counters, attachments, moderation/report workflows, and marketplace transactions.
