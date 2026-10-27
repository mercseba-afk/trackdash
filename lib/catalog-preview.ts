// Explicitly opt in on a Vercel Preview deployment only. Production always
// keeps the ordinary authenticated app and database configuration.
export function isCatalogOnlyPreview(): boolean {
  return process.env.VERCEL_ENV === "preview" && process.env.TRACKDASH_CATALOG_ONLY_PREVIEW === "1"
}

export function isCatalogPreviewRequest(pathname: string, method: string): boolean {
  if (method !== "GET" && method !== "HEAD") return false
  return (
    pathname === "/speed-champions" ||
    pathname === "/speed-champions/catalog" ||
    /^\/speed-champions\/catalog\/\d{5}$/.test(pathname)
  )
}
