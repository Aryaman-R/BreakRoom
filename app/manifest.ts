import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business";

/**
 * Rendered to out/manifest.webmanifest at build time.
 *
 * Not a bid to be an installable app — it is what makes an "Add to Home
 * Screen" bookmark show the cafe's name and colours instead of a screenshot
 * and a truncated URL, which is a normal thing for a regular to do with a
 * cafe they visit weekly.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BUSINESS.name} — ${BUSINESS.address.locality}, ${BUSINESS.address.region}`,
    short_name: BUSINESS.name,
    description: BUSINESS.description,
    start_url: "/",
    display: "browser",
    background_color: "#faf7f2",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
