-- The targeted eBay active-market worker runs with the server-only service role.
-- Production hardening intentionally revoked broad table privileges, so grant
-- only the read capability required to resolve the exact Release context.

grant select on table public.product_releases to service_role;
