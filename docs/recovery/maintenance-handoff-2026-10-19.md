# Authorized maintenance handoff

The user authorized the maintenance phase on 19 October 2026. Public reopening still requires a separate approval after actual persisted scanner and signed provider webhook tests. No Production change or source database mutation was executed in this continuation.

The local checkout unexpectedly reverted to checkpoint 929ce6a. Recovered seven reviewed public source files from the exact previously tested Preview package, overlay SHA256 49d582ef7896f53e514e849e8f2f7edf45dc05183c6e0bd9dd7f1111cfd97898. All recovered file hashes match the stored deployment manifest. pnpm verify and git diff --check passed.

At 16:19 UTC Frankfurt SQL access succeeded: 4 users, 281 product_releases, 209 market_release_signals, 463 market_offer_states and 84 price_points. Source access is denied by the connector. Reauthorize the original TrackDash organization for a fresh read-only comparison, then restore TrackDash New authorization for target work. Do not overwrite new target Auth activity or passwords from an older source snapshot.

Production staging helper and maintenance firewall configuration from the lost local checkpoint have NOT been recovered or deployed. Do not assume they exist. The signed eBay provider notification and persisted scanner execution remain unverified. The user deferred two Storage object bodies and onboarding thumbnails until after release. Keep original data intact, retain TLS verification and avoid simultaneous scheduled scanners.
