import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Block admin, internal APIs and sensitive personal verification paths
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/payment-legacy",
          "/payment-legacy/",
          "/xac-nhan-dong-gop",
          "/xac-nhan-dong-gop/",
        ],
      },
    ],
    sitemap: "https://40namnctru.nctitc.io.vn/sitemap.xml",
  };
}
