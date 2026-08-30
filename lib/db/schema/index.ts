// Single entry point re-exporting the full schema — this is what
// drizzle.config.ts points at, and what lib/db/index.ts imports to build a
// typed client. Add new schema files here as they're created.

export * from "./taxonomy"
export * from "./catalog"
export * from "./profiles"
export * from "./collection"
export * from "./wishlist"
export * from "./market"
export * from "./relations"
