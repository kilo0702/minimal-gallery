import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', '@prisma/adapter-better-sqlite3', '@prisma/client'],
  // Allow access from local network hostnames
  allowedDevOrigins: ['aorus16x', 'localhost'],
};

export default nextConfig;
