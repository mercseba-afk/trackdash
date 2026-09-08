# TrackDash App Functional Audit

Audit baseline: `main` at `894dfeef23de72aee4325f7410d8b97a2a35139d`.

This audit separates real runtime-verified flows from code-wired flows that still need a user smoke test, and from intentionally demo-only features. UNKNOWN is preferable to calling an untested flow PASS.

## Status vocabulary

- **PASS (runtime)** — already exercised successfully with real app state/users.
- **WIRED (smoke pending)** — route/action is connected in code and builds, but has not been independently exercised end-to-end in this audit.
- **FIX** — incomplete, misleading, duplicated, or reported broken.
- **DEMO** — deliberately simulated/non-production behavior and labelled as such.

## Navigation and core surfaces

| Surface / flow | Status | Notes |
| --- | --- | --- |
| Dashboard `/` | WIRED (smoke pending) | Links to Catalog, Scanner, Collection and Wishlist are real routes. Dashboard values still depend on demo market estimates. |
| Catalog `/catalog` | PASS (runtime) | Catalog/Product/Release browsing exercised repeatedly during catalog and UX work. |
| Product `/catalog/[id]` | PASS (runtime) | Product → release navigation, add dialogs and release discovery exercised. |
| Release `/catalog/[id]/releases/[releaseId]` | PASS (runtime) | Exact release, collector section and sharing/messaging entry flow exercised. |
| My Collection `/collection` | PASS (runtime) | Add/edit/delete and visibility Private/Shared/Open to offers exercised. |
| Public collector showcase `/collectors/[username]` | PASS (runtime) | Shared/Open-to-offers projection exercised; private rows remain excluded. |
| Wishlist `/wishlist` | WIRED (smoke pending) | Remove and “I got it” are wired to server actions; dedicated fresh smoke test still desirable. |
| Messages `/messages` | PASS (runtime core) | Request, accept/decline, chat, block/unblock, realtime and share→private history preservation exercised with two real users. Numeric unread badge architecture is live but still deserves a fresh two-user badge smoke test. |
| Scanner `/scanner` manual lookup | WIRED (smoke pending) | Manual item/name lookup uses catalog resolution. |
| Scanner camera / “Scan a box” | DEMO | Camera preview is simulated and scan result can be randomly selected by the demo flow. |
| Market `/market` | DEMO | Explicitly uses generated indicative estimates, not real sold/listing data. |
| Profile `/profile` | FIX → addressed in this branch | User reported “This page couldn’t load”. Existing page mixed identity + settings and profile edits were local-only. Rebuilt as a dedicated collector profile surface with persisted edits. |
| Settings `/settings` | FIX → addressed in this branch | Previously rendered the same ProfileScreen. Rebuilt as a dedicated settings surface. |
| Login / signup / password reset | WIRED (smoke pending) | Supabase Auth-backed surfaces exist; not re-smoked as part of this pass yet. |
| Onboarding | FIX / backlog | Focus selections currently live only in component state and do not personalise later screens. Starter-kit add flow is real. Copy/behavior should be aligned before calling focus preferences functional. |

## Misleading or non-persistent UI found

1. **Profile Save changes** — previously changed only the client cache; refresh lost edits. Fixed in this branch with `updateMyProfileAction()` and RLS-backed DB update.
2. **Profile and Settings duplication** — both routes previously rendered `ProfileScreen`. Fixed in this branch.
3. **Price movement alerts / Wishlist target alerts** — previous toggles were local component state only. New Settings surfaces them as **Coming soon**, not active settings.
4. **Preferred currency** — database field exists and is now persistable. The current market engine remains EUR-based, so Settings explicitly does not claim live currency conversion.
5. **Scanner confidence / market values** — derive from the demo market engine. Keep demo labelling until real price intelligence replaces them.
6. **Onboarding focus** — user choices are not persisted or consumed. Do not describe them as active personalisation without implementing persistence/usage.

## Profile persistence security verification

The existing `public.profiles` table already has:

- authenticated `SELECT`, `INSERT`, `UPDATE` grants;
- RLS enabled;
- own-row SELECT policy;
- own-row UPDATE policy with both `USING` and `WITH CHECK`.

A transaction-scoped authenticated-role update was tested against the live database and rolled back successfully, confirming the RLS update path is allowed for the owning user. The same rollback test succeeded for an existing `collector_profiles` row, allowing an already-public collector identity to stay in sync after profile edits without creating a new public profile for private users.

## Next pass

1. Merge Profile/Settings cleanup after preview/build verification.
2. Implement UI internationalisation with **English + Italiano**.
3. Run a fresh desktop/mobile smoke matrix across all primary routes and CTA families.
4. Ask Claude for independent review of Functional Audit + Profile/Settings + i18n.
5. Resolve findings, then return to Catalog Image/Data Audit.
