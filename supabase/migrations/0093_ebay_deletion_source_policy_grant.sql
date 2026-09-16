-- Marketplace Account Deletion runs with the server-only Supabase secret key.
-- It only needs to read source-family mappings before anonymizing matching
-- eBay evidence in the already-restricted market tables.

grant select on table public.market_source_policies to service_role;
