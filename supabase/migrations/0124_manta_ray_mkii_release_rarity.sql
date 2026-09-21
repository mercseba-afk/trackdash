-- Release-specific rarity for the completed Manta Ray Mk.II family.
-- Rarity is based on documented distribution, age, production status and
-- current observability; it is deliberately not inferred from age alone.

update public.product_releases
set rarity = case id
  when '6a14c7a3-bd78-57b3-89fe-6c764818991a'::uuid then 'Common'
  when '3eb8e671-b09a-5b2d-bb87-729676bd1237'::uuid then 'Rare'
  when 'd0c9c45e-3d75-52d1-92cb-84cf9f5f2a07'::uuid then 'Very Rare'
  when 'eeb02308-6a9a-5d0c-88ee-5a0fc127a0e8'::uuid then 'Rare'
  when 'f1372ca5-e4ad-5994-b31b-2ccb9fc99b6f'::uuid then 'Rare'
  when '9a231f02-7a7e-5489-b44d-b4eb10b60a78'::uuid then 'Rare'
  when 'd6617c26-9ec3-5adf-892f-ebeb1c782b70'::uuid then 'Very Rare'
  when 'a98fe80b-1f8c-53e1-b26d-404daf93b77d'::uuid then 'Uncommon'
  when 'b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid then 'Uncommon'
  when '4fdb8e31-07be-5907-9530-9a9bbe7edcf2'::uuid then 'Uncommon'
  else rarity
end
where product_id='277030d7-5caa-517a-b3d1-bd52d9c48815'::uuid;
