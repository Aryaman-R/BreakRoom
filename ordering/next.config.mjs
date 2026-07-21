import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // This app lives in a subfolder of the main-site repo; trace from here,
    // not the repo root, so the parent lockfile doesn't confuse the build.
    outputFileTracingRoot: __dirname,
  },
};

export default nextConfig;
