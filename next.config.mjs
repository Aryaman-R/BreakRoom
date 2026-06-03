/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — produces ./out for static hosts (Cloudflare Pages).
  output: "export",
  reactStrictMode: true,
  images: {
    // The default Image Optimization loader needs a server; export ships raw images.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
