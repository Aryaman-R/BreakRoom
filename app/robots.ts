import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/business";

/** Generated to out/robots.txt at build time. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // A forwarding stub, not a destination — keep it out of the index so it
      // cannot outrank the real ordering app.
      disallow: ["/online-order"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
