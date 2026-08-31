// Convenience re-export of the whole data access layer. Prefer importing
// from the specific domain file (e.g. "@/lib/db/queries/collection") in
// new code — this barrel exists for call sites that need more than one
// domain at once.

export * as catalogQueries from "./catalog"
export * as collectionQueries from "./collection"
export * as marketQueries from "./market"
export * as profileQueries from "./profiles"
export * as wishlistQueries from "./wishlist"
