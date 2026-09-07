/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // MVP (see docs/IMAGES_MVP.md): remote-hotlinked official Tamiya
    // product images, stored as plain URLs in product_images/
    // release_images (scripts/data/tamiya-images.ts is the source
    // mapping). Deliberately restrictive — only the exact official hosts
    // and path prefixes actually used by audited image entries, never a
    // broad wildcard. Add a new entry here only when a genuinely new
    // official Tamiya image host/path is verified and introduced.
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
      {
        protocol: "https",
        hostname: "www.tamiyausa.com",
        pathname: "/media/CACHE/images/products/**",
      },
      {
        protocol: "https",
        hostname: "d7z22c0gz59ng.cloudfront.net",
        pathname: "/cms/img/**",
      },
    ],
  },
}

export default nextConfig
