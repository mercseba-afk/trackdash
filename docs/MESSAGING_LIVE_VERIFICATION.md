# Messaging MVP live verification — 2026-09-08

Supabase project: TrackDash (`piwogtdkfozbiakyjnvk`).

Applied migrations:
- `messaging_mvp`
- `messaging_share_unlink_guard`
- `messaging_fk_indexes`

Verified live:
- RLS enabled on `collector_blocks`, `conversations`, `messages`.
- `anon` has no table grants; direct anon SELECT on `conversations` returns permission denied.
- `authenticated` grants are scoped: block SELECT/INSERT/DELETE, conversation SELECT/INSERT plus UPDATE only on `status` and `updated_at`, message SELECT/INSERT.
- self-block attempt is rejected by RLS.
- `public.messages` is present in the `supabase_realtime` publication.
- all three messaging tables remained at 0 rows after verification.
- Supabase security advisor introduced no messaging-specific warning.
- performance advisor introduced no unindexed-foreign-key warning for messaging tables.

Known test limitation:
- the live project currently has only one Auth user, so a positive two-user request -> accept -> message flow was not fabricated in production. That flow must be tested with a genuine second test account before treating cross-user behavior as manually smoke-tested.
