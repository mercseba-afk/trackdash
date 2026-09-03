/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // MVP (see docs/IMAGES_MVP.md): remote-hotlinked official Tamiya
    // product images, stored as plain URLs in product_images/
    // release_images (scripts/data/tamiya-images.ts is the source
    // mapping). Deliberately restrictive — only the exact host and path
    // prefix actually used, not a wildcard for all of tamiya.com or any
    // broader pattern. Add a new entry here (with a matching note) only
    // when a genuinely new official Tamiya image host is used.
    //
    // Optimization is intentionally ON (not unoptimized) so this
    // remotePatterns restriction is actually enforced — Next.js skips the
    // domain allowlist entirely when images.unoptimized is true, which
    // would make this list purely decorative.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.tamiya.com",
        pathname: "/japan_contents/img/**",
      },
    ],
  },
}

export default nextConfig
