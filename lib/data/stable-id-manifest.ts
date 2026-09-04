// TrackDash — immutable stable-ID manifest (Catalog Model V2 hardening,
// point 5). This is the AUTHORITATIVE, APPEND-ONLY record of every
// product/release UUID ever allocated as of a confirmed deployment. It is
// deliberately a checked-in literal, NOT derived from lib/data/products.ts
// at runtime -- so scripts/check-catalog-invariants.mjs can detect an id
// that has DISAPPEARED or CHANGED (a runtime-derived floor could never
// notice a deletion, since it would just re-derive the smaller set).
//
// RULES:
//   - APPEND-ONLY. When a migration that adds new legitimate rows is
//     confirmed applied, append their ids here. NEVER remove or edit an
//     existing entry.
//   - The invariant checker HARD-FAILS if any id listed here is missing
//     from the current catalog, or if its product/release kind changed.
//   - Currently 36 products + 62 releases = 98 ids (the 96 originally
//     deployed + the 2 releases added in the catalog integrity Final
//     Fixes pass: Dash-2 Burning Sun Type-3, Dyna-Hawk GX 2019 reissue).

export interface StableIdManifestEntry {
  id: string
  kind: "product" | "release"
  label: string
}

export const STABLE_ID_MANIFEST: StableIdManifestEntry[] = [
  { id: "c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3", kind: "product", label: "Aero Avante" },
  { id: "c7a440cc-dc07-5ecc-bae3-c2770dc8b66e", kind: "product", label: "Raikiri" },
  { id: "d341ec22-c1f9-5a03-906d-444f8eee5401", kind: "product", label: "DCR-01" },
  { id: "68acb096-f01b-55b2-949b-a959279a2fa5", kind: "product", label: "Geo Glider" },
  { id: "6f41e40f-a48e-509f-8602-dfd303e25795", kind: "product", label: "Shadow Shark" },
  { id: "51deac9c-f8a7-5eff-984f-968d6ad88659", kind: "product", label: "Festa Jaune" },
  { id: "9793fbe8-dcf7-51c9-9f45-185194a0bc92", kind: "product", label: "Neo-Tridagger ZMC" },
  { id: "fa551244-1a12-54ec-b937-ad1b5603e8bb", kind: "product", label: "Magnum Saber" },
  { id: "896cc70e-3048-594d-9389-cb9808a5ad53", kind: "product", label: "Sonic Saber" },
  { id: "f603ed6f-e601-5372-9fe7-6fd1034b6065", kind: "product", label: "Victory Magnum" },
  { id: "53791485-2948-5176-8acb-2ec947eafc51", kind: "product", label: "Cyclone Magnum" },
  { id: "a66d871c-00b1-56e5-9bc4-1621ea1729b2", kind: "product", label: "Beat Magnum" },
  { id: "dee35418-283b-5603-889b-b3eb2d68eea5", kind: "product", label: "Hurricane Sonic" },
  { id: "da28c703-24ef-5ebd-a952-87346735dc7e", kind: "product", label: "Buster Sonic" },
  { id: "82b478fd-21dd-5c93-82fb-bf50461a107d", kind: "product", label: "Avante" },
  { id: "6dcb6511-5277-561f-a880-95ef828ce44f", kind: "product", label: "Avante Mk.II" },
  { id: "dcd372ac-5ad2-5a70-ae48-f1c4a6d6de4a", kind: "product", label: "Super Avante" },
  { id: "a00d2b12-6a67-56ee-8db5-392eaf86d5c7", kind: "product", label: "Vanguard Sonic" },
  { id: "2972e27d-7c75-5534-9ed4-1603ef4a6655", kind: "product", label: "Dash-1 Emperor" },
  { id: "203f8219-9d37-5a1a-aad6-9437c80a1ea8", kind: "product", label: "Great Emperor" },
  { id: "a1fd4f6d-0834-5f09-ac3c-5d4b398f0968", kind: "product", label: "Proto Emperor ZX" },
  { id: "3b443635-b33f-5553-a39d-eba8b8cafddb", kind: "product", label: "Dash-2 Burning Sun" },
  { id: "4b53383c-c417-53c6-addb-e87126546d89", kind: "product", label: "Dash-3 Shooting Star" },
  { id: "d2c3e3d8-050d-5b9b-932f-023f2ee7dce2", kind: "product", label: "Dash-4 Cannon Ball" },
  { id: "be48e786-11c6-567f-b063-8026957bb403", kind: "product", label: "Astute" },
  { id: "0b2e1cf8-6c19-5342-89ef-6a53b3f51af3", kind: "product", label: "Manta Ray" },
  { id: "65c7f3e3-ebfc-55a6-8855-c0c495164b72", kind: "product", label: "Fire Dragon" },
  { id: "813a9ba0-170e-5636-9a9a-a7e7fca32366", kind: "product", label: "Dash-01 Horizon" },
  { id: "d3b4ad34-05ac-592e-ad93-fab4cfde0a5a", kind: "product", label: "Dyna-Hawk GX" },
  { id: "643f208f-c8f6-5574-b9cf-565e28602d17", kind: "product", label: "Mad Bull" },
  { id: "b972592b-ce68-5f39-b3a1-cdc8984d3817", kind: "product", label: "Trigale" },
  { id: "5b415a05-bc7c-589c-8b9c-3b3806479f6b", kind: "product", label: "Sword Flash" },
  { id: "e2f47ba4-03f1-5adb-8252-471c76729292", kind: "product", label: "Copperfang" },
  { id: "059b5b3f-9ee9-5932-b39f-879642b9414c", kind: "product", label: "Thunder Shot" },
  { id: "6d6174e7-4040-5035-a3a4-cede97265d38", kind: "product", label: "Emperor (Premium Black Special)" },
  { id: "07cc02e9-2626-5a60-92fb-2c2ed2402d7f", kind: "product", label: "Aero Avante Japan Cup 2013" },
  { id: "a2baec17-32b5-5ca7-996b-4cdc2da725ba", kind: "release", label: "Aero Avante — Aero Avante" },
  { id: "107f030c-2b39-5659-8c00-ae11bd2a86d4", kind: "release", label: "Aero Avante — Aero Avante Clear Body (Polycarbonate)" },
  { id: "21b0cb0d-bb39-51ff-a5e6-df45c3245372", kind: "release", label: "Aero Avante — Aero Avante Black Special" },
  { id: "9a415521-3094-5724-a26b-e42a2c0148fa", kind: "release", label: "Raikiri — Raikiri" },
  { id: "5addae7a-e863-5cfe-8231-7af05fcfcbb6", kind: "release", label: "Raikiri — Raikiri Black Special" },
  { id: "d32c3468-4ce4-5968-ba4e-d1e47e30eb01", kind: "release", label: "DCR-01 — DCR-01" },
  { id: "a9a18e0d-7aa2-5481-94b6-ebc670daaa55", kind: "release", label: "Geo Glider — Geo Glider" },
  { id: "b57fbc18-d57c-5b3c-9def-ffb4e70c9e27", kind: "release", label: "Shadow Shark — Shadow Shark" },
  { id: "cbd6e611-e421-5c10-bbd3-352beb80f6fc", kind: "release", label: "Festa Jaune — Festa Jaune" },
  { id: "fcaf3f82-93b5-5a52-8087-c96e771a030c", kind: "release", label: "Neo-Tridagger ZMC — Neo-Tridagger ZMC" },
  { id: "73dcd8e6-82ab-54c4-961b-f4132bf6d638", kind: "release", label: "Neo-Tridagger ZMC — Neo-Tridagger ZMC (Premium)" },
  { id: "4a1b7d1f-a2f7-5113-9962-21fa14a47968", kind: "release", label: "Magnum Saber — Magnum Saber" },
  { id: "0fdbfd56-f257-5b84-b541-e08a7450cc34", kind: "release", label: "Magnum Saber — Magnum Saber Premium" },
  { id: "e23951fd-63a5-5233-8c53-969c57e98819", kind: "release", label: "Sonic Saber — Sonic Saber" },
  { id: "62cca367-8a73-5280-b2a2-0aa9497d093d", kind: "release", label: "Sonic Saber — Sonic Saber Premium" },
  { id: "6ed25d50-4099-5924-b7e5-d7a21945a3f6", kind: "release", label: "Victory Magnum — Victory Magnum" },
  { id: "0bdb9bcd-e4aa-53ab-b004-984cae96fdca", kind: "release", label: "Victory Magnum — Victory Magnum Premium" },
  { id: "efd6902b-f080-5165-8a13-0375c1d32298", kind: "release", label: "Cyclone Magnum — Cyclone Magnum" },
  { id: "85a3549a-d563-5dda-bc6d-bd1ac684601e", kind: "release", label: "Cyclone Magnum — Cyclone Magnum Premium" },
  { id: "7683c862-f484-5603-aa28-c76ae7453892", kind: "release", label: "Beat Magnum — Beat Magnum" },
  { id: "a49b33d9-9f2c-5333-9521-8a7c732995d2", kind: "release", label: "Beat Magnum — Beat Magnum Premium" },
  { id: "71addadb-04b3-579f-96f2-c5e976cf1cd5", kind: "release", label: "Hurricane Sonic — Hurricane Sonic" },
  { id: "e1b626f8-e0ea-52c9-86f0-eb870561d70d", kind: "release", label: "Hurricane Sonic — Hurricane Sonic Premium" },
  { id: "217fd7d2-2090-593c-bb7d-bef7ce1cf154", kind: "release", label: "Buster Sonic — Buster Sonic" },
  { id: "cafbb6ca-1aba-5732-946d-0045d054aa5c", kind: "release", label: "Avante — Avante Jr." },
  { id: "7f3f7461-0dee-5d6a-b99d-36e2d910f0ef", kind: "release", label: "Avante — Avante (Premium)" },
  { id: "5a123617-c84c-5012-ab20-1a9d493259e0", kind: "release", label: "Avante Mk.II — Avante Mk.II" },
  { id: "5e5251c2-a130-5fb0-93a7-2bd73c63736d", kind: "release", label: "Super Avante — Super Avante" },
  { id: "203f1f0f-1f5d-5e3b-bd56-b1a175f3e121", kind: "release", label: "Vanguard Sonic — Vanguard Sonic" },
  { id: "b3639c7d-581e-5da8-9ec4-ea1eb9d61193", kind: "release", label: "Vanguard Sonic — Vanguard Sonic (Super II)" },
  { id: "96adee91-eaec-5c73-9269-cf3875cfe02d", kind: "release", label: "Dash-1 Emperor — Dash-1 Emperor (Type 3 Chassis)" },
  { id: "f576fa21-8e57-5fa0-953e-f468653e3767", kind: "release", label: "Dash-1 Emperor — Dash-1 Emperor Premium" },
  { id: "96babc1a-f153-59fa-b840-7ff68fb50f38", kind: "release", label: "Dash-1 Emperor — Dash-1 Emperor Premium (Black Special)" },
  { id: "b7eeb76a-e117-59ae-b31c-b099368421af", kind: "release", label: "Dash-1 Emperor — Dash-1 Emperor 30th Anniversary" },
  { id: "79e32904-fe5d-5d30-bf54-8643ce4b42d3", kind: "release", label: "Dash-1 Emperor — Dash-1 Emperor (2026 Reissue)" },
  { id: "8c2ca80b-8a9d-5b7a-9325-aec13a0db9ba", kind: "release", label: "Great Emperor — Great Emperor" },
  { id: "532f8e3a-f55f-5936-abcd-58e0f8538785", kind: "release", label: "Great Emperor — Great Emperor Premium" },
  { id: "4d5b0a9a-498f-51fc-accd-9316ca11c843", kind: "release", label: "Proto Emperor ZX — Proto Emperor ZX" },
  { id: "f0614cb8-d0cb-521d-aa2c-4fc304f39430", kind: "release", label: "Proto Emperor ZX — Proto Emperor ZX Premium (Black Special)" },
  { id: "1d677e65-ca9c-5549-94c5-32e9b957b31a", kind: "release", label: "Dash-2 Burning Sun — Dash-2 Burning Sun" },
  { id: "45f04c74-a41c-5514-87a2-ab47ea6d66b6", kind: "release", label: "Dash-2 Burning Sun — Dash-2 Burning Sun (Type 3 Chassis)" },
  { id: "178ef6b8-594c-5cf4-8084-3c910576b29b", kind: "release", label: "Dash-3 Shooting Star — Dash-3 Shooting Star" },
  { id: "c63b8f4a-43f3-597b-82e5-f0e45bb45b7a", kind: "release", label: "Dash-4 Cannon Ball — Dash-4 Cannon Ball" },
  { id: "3d1c1580-c921-530f-9aaf-7ca5ff77e86c", kind: "release", label: "Astute — Astute" },
  { id: "96deae1d-dfec-5aaf-a247-835386533002", kind: "release", label: "Astute — Astute (Reissue)" },
  { id: "b86d459a-bd44-5c68-b104-9ca4cedaf413", kind: "release", label: "Manta Ray — Manta Ray" },
  { id: "5277616b-91d3-5f0c-b893-d77778beaf95", kind: "release", label: "Manta Ray — Manta Ray (2015 Reissue)" },
  { id: "0e24ff2a-70e6-5909-b28d-67400a365c92", kind: "release", label: "Fire Dragon — Fire Dragon" },
  { id: "daf1d532-80b5-524f-896e-fb577dae2445", kind: "release", label: "Fire Dragon — Fire Dragon Premium" },
  { id: "a0b042ac-7e6c-57f4-98a2-bd92e8e39f39", kind: "release", label: "Dash-01 Horizon — Dash-01 Horizon" },
  { id: "2af882f6-8c66-5508-9acd-2240aac287ad", kind: "release", label: "Dyna-Hawk GX — Dyna-Hawk GX" },
  { id: "1ede5023-9035-5342-b207-6242c5f5190a", kind: "release", label: "Dyna-Hawk GX — Dyna-Hawk GX Super XX Special" },
  { id: "ace0d1b1-aaf3-589a-977c-a3df07c83c73", kind: "release", label: "Dyna-Hawk GX — Dyna-Hawk GX Super XX Special (2019 Reissue)" },
  { id: "454a8d07-e963-5699-9a8c-2151917f75a5", kind: "release", label: "Mad Bull — Mad Bull" },
  { id: "eb3b81bb-3a11-56af-a0cf-b625a1501434", kind: "release", label: "Mad Bull — Mad Bull (2013 Reissue)" },
  { id: "08b3cc73-8c45-5ddd-bab4-9167c7f93c41", kind: "release", label: "Trigale — Trigale" },
  { id: "2a5e1b1b-07e8-57fa-a202-0b38982b168e", kind: "release", label: "Sword Flash — Sword Flash" },
  { id: "9058782c-0e3c-5a3d-9f9c-391365d3e81e", kind: "release", label: "Copperfang — Copperfang" },
  { id: "dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087", kind: "release", label: "Thunder Shot — Thunder Shot (Type 3)" },
  { id: "f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a", kind: "release", label: "Thunder Shot — Thunder Shot Premium" },
  { id: "8c923a15-a5e7-5e5c-ab8f-b2d1f722ac76", kind: "release", label: "Emperor (Premium Black Special) — Emperor (Premium Black Special)" },
  { id: "035abf4d-65da-5b0c-855d-9e611798c4e4", kind: "release", label: "Aero Avante Japan Cup 2013 — Aero Avante Japan Cup 2013" },
]
