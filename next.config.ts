import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid bundling tesseract worker internals into .next server output.
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
