-- Image Audit / Fix -- DASH-X1 Proto-Emperor Premium Black Special (95450).
--
-- Adds one exact release-level image for the verified 2019 Black Special.
-- Identity is anchored to TrackDash's immutable release UUID, never to the
-- Tamiya item number. Official Tamiya page confirms item/name/date/chassis
-- and the black/yellow specification; RCJaz independently corroborates the
-- exact Black Special variant. The image itself is served from Tamiya's
-- official item-scoped image host and was verified through TrackDash's
-- production Next Image optimizer (HTTP 200, image/jpeg).
--
-- No schema/catalog/resolver change. Existing migrations remain untouched.

insert into release_images (id, release_id, url, position) values
  (
    '2d49c444-df6a-5b78-bc69-32ec3f406375',
    '6168c423-9f3e-5495-9a1d-06185ea7fa34',
    'https://www.tamiya.com/japan_contents/img/usr/item/9/95450/95450_1.jpg',
    0
  )
on conflict (id) do nothing;
