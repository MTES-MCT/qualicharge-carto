import type { NextConfig } from "next";

const repo = 'qualicharge-dataviz';
const shouldUseBasePath = process.env.GITHUB_PAGES === 'true';
const basePath = shouldUseBasePath ? `/${repo}` : '';


const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};


export default nextConfig;
