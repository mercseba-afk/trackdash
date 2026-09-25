/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_TRACKDASH_BUILD_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "development",
  },
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
        hostname: "d7z22c0gz59ng.cloudfront.net",
        pathname: "/japan_contents/img/usr/item/**",
      },
      {
        protocol: "https",
        hostname: "www.tamiyausa.com",
        pathname: "/media/CACHE/images/products/**",
      },
      {
        protocol: "https",
        hostname: "www.tea-league.com",
        pathname: "/web/**",
      },
      {
        protocol: "https",
        hostname: "d7z22c0gz59ng.cloudfront.net",
        pathname: "/japan_contents/img/**",
      },
      {
        protocol: "https",
        hostname: "www.tamiyausa.com",
        pathname: "/media/CACHE/images/products/**",
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
      {
        protocol: "https",
        hostname: "hongta.co.kr",
        pathname: "/web/product/**",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
        pathname: "/m4dtang.com/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "static.www.sanfrecce.co.jp",
        pathname: "/images/news/2023/07/0703_02_02.jpg",
      },
      {
        protocol: "https",
        hostname: "www.rcjaz.ca",
        pathname: "/images/tamiya/**",
      },
      {
        // Hornet Jr. 92412 Tanahashi Special — exact product image from the
        // original Gakken/PR TIMES 2018 launch release. Keep the allowlist
        // deliberately restricted to this one audited asset.
        protocol: "https",
        hostname: "prtimes.jp",
        pathname: "/i/2535/1951/resize/d2535-1951-173568-3.jpg",
      },
      {
        // Hornet Jr. 1998 Memorial / limited-reissue archive image.
        // Exact auction asset extracted from the Mandarake item archive.
        protocol: "https",
        hostname: "img.mandarake.co.jp",
        pathname: "/aucimg/5/1/4/5/0002715145.jpeg",
      },
      {
        protocol: "https",
        hostname: "static.mercdn.net",
        pathname: "/item/detail/orig/photos/**",
      },
      {
        protocol: "https",
        hostname: "assets.mercari-shops-static.com",
        pathname: "/-/large/plain/**",
      },
      {
        protocol: "https",
        hostname: "cdn.suruga-ya.jp",
        pathname: "/database/pics_webp/game/**",
      },
      {
        // Thunder Dragon Clear Special 95336 — exact archived product image.
        // The official Tamiya page still verifies the Release, but its legacy
        // direct 95336_1.jpg asset currently returns 404 through Next Image.
        protocol: "https",
        hostname: "www.1999.co.jp",
        pathname: "/itbig47/10477144a.jpg",
      },
      {
        // Avante Jr. Special Version 18507 — exact vintage product photo from
        // the audited JOY of the FIND 18507-600 specialist listing.
        protocol: "https",
        hostname: "joyofthefind.co.uk",
        pathname: "/cdn/shop/files/rn-image_picker_lib_temp_1615b926-d90e-460f-a9ed-b31e02e45f38.jpg",
      },
    ],
  },
}

export default nextConfig
