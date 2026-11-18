/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  cleanDistDir: false,
  experimental: {
    webpackBuildWorker: false,
    // Native binary module (.node) must be loaded by Node directly, not bundled
    // by webpack — required for Argon2id password hashing.
    serverComponentsExternalPackages: ["@node-rs/argon2"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
