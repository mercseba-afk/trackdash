# TrackDash functional audit — 28 October 2026

Production: `trackdash.it`, recovery/frankfurt-migration; database: Frankfurt `uhojhqxnzrolmnopwgpy`.

## Verified evidence

- Two non-admin accounts created in the preceding seven days; no missing profile or subscription rows. No personal identities or activity histories were exported.
- The 14-stage SQL integration audit ran against the deployed schema under the same `authenticated` role and per-user claims as `withUserContext`. Three generated test principals had no passwords, sessions or deliverable email addresses. All fixture rows, notifications, sale evidence and queue effects were rolled back. Afterwards, zero fixture accounts remained.
- Passed: automatic profile creation, collection create/read/update, wishlist create/read/update/delete, cross-account private-collection isolation, opening a copy to offers, contact request, rejection of chat before acceptance, accepting a contact, messages in both directions, read receipt, exclusion of an unrelated third user, initial offer, counteroffer, denial of self-acceptance, acceptance by the counterparty, seller sale report, buyer confirmation, collection transfer and acquisition cost, purchased-copy removal, account/profile data cascades.
- The runtime role is neither superuser nor BYPASSRLS. RLS is enabled on the seven checked account/collection/messaging/deal tables. Security-definer RPCs explicitly check the authenticated principal and transaction participants. Automated advisor findings about intentionally server-only RLS tables and participant RPCs are not evidence of a data leak.
- Seven Storage cleanup tests cover active, historical and orphaned photos, paging, 1000-object deletion batches, user-prefix isolation, invalid names and error propagation. Full repository verification passes.

## Fixed defects

1. A purchased copy could not be removed or resold: `collection_item_transfers.buyer_collection_item_id` used `ON DELETE RESTRICT`. Migration `20261028160935_allow_removing_transferred_collection_copies` makes the live-copy reference nullable with `ON DELETE SET NULL`; immutable sale and transfer snapshots remain. The original failure was reproduced, the candidate DDL passed a rolled-back simulation, and the integration audit passed after the production migration.
2. Account deletion cleaned only photos still linked to current collection rows. It could miss retained sold-copy photos and unregistered uploads. Cleanup now enumerates the authenticated account's Storage folder before deleting through the Storage API, never SQL. It is limited to that account and aborts Auth deletion on a Storage failure. No real user's objects or account were deleted during this audit.

## Current offer/sale behavior

Sharing as `open_to_offers` exposes a specific owned copy. A buyer can start an offer or send a contact request; plain chat requires acceptance of the contact. Offers can be accepted, rejected or superseded by a counteroffer. Acceptance reserves the listing against another accepted deal; it does not charge a payment card or arrange delivery. Payment and shipping are agreed outside TrackDash. The seller records the real final item price, optional shipping and date. The buyer confirms or disputes it. Only buyer confirmation transfers one copy, records the final item price as the buyer's acquisition cost, and queues a market recomputation. A confirmed sale is evidence, not an unconditional guaranteed Market Value.

Account deletion is in Settings → Account security → Delete account, requires `ELIMINA`, a final confirmation and the required MFA level. Admin accounts are protected from this self-service route.

## Legal copy and remaining limits

The Terms, not the personal-data notice, now clarify independent status, ownership of product names/marks/logos/packaging/photos, and the actual offer/sale flow. They do not claim that credit or public availability grants permission to reuse a photograph. References checked: European Commission Your Europe copyright guidance, CJEU C-161/17 press release, EU trade mark Regulation 2017/1001 Article 14, and official Supabase user-deletion/Storage guidance.

This is not a full legal compliance certification. The Privacy Policy still identifies the controller generically and refers unauthenticated users to the Google/OAuth support contact. A clear controller identity and direct public contact must be supplied by the owner; this audit does not invent or publish personal contact details. Image-by-image licence/provenance clearance remains separate from an ownership notice. The advisor also reports leaked-password protection disabled; no plan upgrade or Auth configuration change was made.

No authenticated browser session was available for a fresh click-through, so actual login/session restoration, realtime delivery across two browsers, photo upload/deletion and the irreversible Auth/Storage deletion endpoint are not claimed as live end-to-end passes. Database transactions, server/UI wiring and the relevant controlled tests were checked separately. No real messages were sent to the two new members. No scanner was started and no scan budget was raised.
