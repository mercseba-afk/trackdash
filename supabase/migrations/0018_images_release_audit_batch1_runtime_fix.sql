-- Image Audit / Fix — batch 1 runtime hardening
--
-- Migration 0017 correctly attached exact release identities for Avante
-- Mk.III Nero (18627) and Japan Cup 2015 (95087), but initially used exact
-- assets served by Tamiya USA. Those URLs were subsequently tested through
-- TrackDash's production Next.js image optimizer and returned
-- INVALID_IMAGE_OPTIMIZE_REQUEST.
--
-- The corresponding official tamiya.com item assets below were then tested
-- through the SAME production optimizer and returned HTTP 200 image/jpeg.
-- This migration therefore keeps the release-image identity unchanged and
-- only switches the URLs to the runtime-safe official Tamiya assets.
--
-- 18627 -> official item asset /1/18627/18627_1.jpg
-- 95087 -> official item asset /9/95087/95087_1.jpg

update release_images
set url = 'https://www.tamiya.com/japan_contents/img/usr/item/1/18627/18627_1.jpg'
where id = 'c9017410-eac7-59a8-9610-64022841a9eb'
  and release_id = '86763fe4-bfc0-551e-8541-c3fc9c2442b7';

update release_images
set url = 'https://www.tamiya.com/japan_contents/img/usr/item/9/95087/95087_1.jpg'
where id = 'a81bad8f-f6c2-5c25-9a87-a092f1b979f7'
  and release_id = '68be3b41-30a7-55be-8cd9-f741193ce595';
