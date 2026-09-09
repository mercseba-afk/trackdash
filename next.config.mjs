/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Catalog v1 image policy (see docs/IMAGES_MVP.md): prefer exact
    // official Tamiya imagery, but allow an audited specialist/retailer
    // image when the official archive does not expose the exact Release.
    //
    // Keep this deliberately restrictive: every hostname/path below is
    // tied to an image that has been manually matched to an exact Release.
    // Never add a broad catch-all wildcard just to make an image render.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.tamiya.com",
        pathname: "/japan_contents/img/**",
      },
      {
        protocol: "https",
        hostname: "d7z22c0gz59ng.cloudfront.net",
        pathname: "/cms/img/**",
      },
      {
        protocol: "https",
        hostname: "4.bp.blogspot.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.chrishouse.ca",
        pathname: "/cdn/shop/files/**",
      },
      {
        protocol: "https",
        hostname: "bananagames.ca",
        pathname: "/cdn/shop/files/**",
      },
      {
        protocol: "https",
        hostname: "www.totarahobbies.co.nz",
        pathname: "/cdn/shop/products/**",
      },
      {
        protocol: "https",
        hostname: "chicohobby.com",
        pathname: "/cdn/shop/files/**",
      },
      {
        protocol: "https",
        hostname: "s3-ap-northeast-1.amazonaws.com",
        pathname: "/hobbystock/img/item/**",
      },
      {
        protocol: "https",
        hostname: "item-shopping.c.yimg.jp",
        pathname: "/i/n/**",
      },
      {
        protocol: "https",
        hostname: "cdn11.bigcommerce.com",
        pathname: "/s-hekrabusyi/**",
      },
      {
        protocol: "https",
        hostname: "down-id.img.susercontent.com",
        pathname: "/file/**",
      },
      {
        protocol: "https",
        hostname: "down-my.img.susercontent.com",
        pathname: "/file/**",
      },
      {
        protocol: "https",
        hostname: "cf.shopee.com.my",
        pathname: "/file/**",
      },
      {
        protocol: "https",
        hostname: "img.amiami.jp",
        pathname: "/images/product/**",
      },
    ],
  },
}

export default nextConfig
