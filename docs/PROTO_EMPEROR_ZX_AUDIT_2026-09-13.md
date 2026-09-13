# Proto Emperor ZX audit — 2026-09-13

## Result

TrackDash now models the family as three distinct commercial Releases:

- **1992 original** — ITEM 18038, Zero chassis, regular release 1992-02-18. The 1991 event pre-sale is historical context, not modeled as a separate Release.
- **2007 reissue** — ITEM 18038, Zero chassis, released 2007-09-01, JAN 4950344997107.
- **2017 Premium** — ITEM 95335, Super-II chassis, released 2017-07-15, JAN 4950344953356.

The existing 2007 Release UUID is preserved and reclassified from Original to Reissue. A new stable Release UUID is allocated for the 1992 original, and the Product canonical release now points to that historical original.

## Identity / scanner rule

ITEM 18038 is reused by the 1992 original and the 2007 reissue. Therefore an item-number-only lookup must not silently select one of them. TrackDash resolves `18038` to the Proto Emperor ZX model and asks the user to choose the Release; a verified explicit barcode can still resolve a specific occurrence.

The 1992 barcode remains unknown. TrackDash does not derive or invent one.

## Image provenance

The current official Tamiya image attached to ITEM 18038 is evidence for the 2007 reissue because the same official page explicitly dates that occurrence to 2007-09-01. It is not treated as proof of the 1992 box art. The 1992 Release intentionally remains without an exact release image until a sufficiently verified archival image is available.

## Sources

- Tamiya ITEM 18038: https://www.tamiya.com/japan/products/18038/index.html
- Tamiya ITEM 95335: https://www.tamiya.com/japan/products/95335/index.html
- CoroCoro historical article: https://corocoro-news.jp/special/317457/
- Japanese Mini 4WD reference: https://w.atwiki.jp/mini4vipwiki/pages/107.html
- Hobby Search ITEM 18038 / JAN: https://www.1999.co.jp/10086737
- Hobby Search ITEM 95335 / JAN: https://www.1999.co.jp/10460640
