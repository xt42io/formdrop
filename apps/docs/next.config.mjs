import { createMDX } from "fumadocs-mdx/next";

/**
 * Served at formdrop.co/docs (D2), reached by a rewrite from apps/web rather
 * than a subdomain -- so existing /docs URLs keep working and the docs stay
 * on the primary domain for SEO.
 *
 * basePath tells Next that /docs is its root, so every asset URL and internal
 * link it generates already carries the prefix. Without it the rewrite would
 * serve HTML whose scripts all 404.
 */
const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  basePath: "/docs",
  reactStrictMode: true,
  // The docs are static: there is no per-request data here, so the whole
  // site can be generated at build time and served from the edge.
  output: "standalone",
};

export default withMDX(config);
