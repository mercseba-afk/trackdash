-- Cross-vertical catalog hardening.
-- Mini 4WD rarity values remain unchanged. New verticals may keep rarity
-- unknown until a documented methodology exists rather than inventing one.

alter table public.products
  alter column rarity drop not null;
