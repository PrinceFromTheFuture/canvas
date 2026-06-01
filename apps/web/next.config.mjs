import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

// Next only reads .env from the app dir; this is a monorepo, so load the
// root .env into process.env at server startup (covers server components,
// route handlers, and the build).
const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, "..", "..", ".env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TS source; let Next transpile them.
  transpilePackages: [
    "@arb/ai",
    "@arb/data",
    "@arb/db",
    "@arb/report-language",
    "@arb/streaming",
    "@arb/trpc",
  ],
  // Renamed from experimental.serverComponentsExternalPackages in Next 15+.
  // esbuild / @react-pdf / ioredis / postgres must stay server-side.
  serverExternalPackages: ["esbuild", "@react-pdf/renderer", "ioredis", "postgres"],
  // Turbopack-only: no webpack config. The `.js`->`.ts` extension-alias hack
  // is unnecessary because workspace sources now use extensionless relative
  // imports, which Turbopack resolves natively.
};

export default nextConfig;
