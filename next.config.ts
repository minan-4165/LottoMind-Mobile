import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/LottoMind-Mobile",
  assetPrefix: "/LottoMind-Mobile/",
  images: { unoptimized: true },
};

export default nextConfig;
