// The redesign can be switched on for production after release approval.
export const racingStudioIsLive = false

export function isRacingStudioPreview() {
  return (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "feat/racing-studio-test")
    || (!process.env.VERCEL_ENV && process.env.TRACKDASH_RACING_TEST === "1")
}

export function isRacingStudioEnabled() {
  return racingStudioIsLive || isRacingStudioPreview()
}

export function isRacingPreviewPage(pathname: string) {
  const path = pathname.replace(/^\/en(?=\/|$)/, "") || "/"
  return /^\/(?:$|catalog(?:\/[^/]+(?:\/releases\/[^/]+)?)?$|speed-champions(?:\/(?:catalog(?:\/\d{5})?|market))?$|market$|guide(?:\/[^/]+)?$|shop(?:\/[^/]+)?$|privacy$|terms$|how-it-works$|find$|login$|signup$|forgot-password$|robots\.txt$|sitemap\.xml$|api\/version$|catalog\/dash-1-emperor-\d{5}-\d{4}-original-confezione\.jpeg$|racing-studio\/[a-z-]+\.webp$|speed-champions\/images\/[\w-]+\.jpg$)/.test(path)
}
