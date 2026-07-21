import type { NextConfig } from "next";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "talia-sourcing-intelligence";
const onGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: onGitHubPages ? `/${repository}` : "",
  assetPrefix: onGitHubPages ? `/${repository}/` : undefined,
  poweredByHeader: false,
};

export default nextConfig;
