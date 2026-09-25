import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Block admin & API endpoints from indexing
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: [
      "https://40th-anniversary-nct.nctitc.io.vn/sitemap.xml",
      "https://ki-niem-40-nam-nct.nctitc.io.vn/sitemap.xml",
    ],
  };
}
