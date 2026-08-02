import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/business";

/**
 * Generated to out/sitemap.xml at build time. `output: "export"` renders
 * metadata routes like this one to static files, so no server is needed.
 *
 * /online-order is deliberately absent — it exists only to forward people who
 * have the old URL to the order-ahead app, and it is marked noindex.
 */
export const dynamic = "force-static";

const ROUTES = ["", "/menu", "/visit", "/about", "/events", "/book"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  // Static export cannot know the deploy time at request time; the build time
  // is the honest answer and is what a static host would report anyway.
  const lastModified = new Date();

  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "" || path === "/menu" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/menu" || path === "/visit" ? 0.8 : 0.6,
  }));
}
