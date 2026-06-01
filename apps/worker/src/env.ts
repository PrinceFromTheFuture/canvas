import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

/**
 * Load the monorepo-root .env BEFORE any module that reads env at import time
 * (e.g. @arb/streaming and @arb/db create their clients on module eval). This
 * file must be the FIRST import in the worker entrypoint. cwd is the package
 * dir when run via turbo/npm; cover both layouts.
 */
for (const candidate of [
  path.resolve(process.cwd(), "..", "..", ".env"),
  path.resolve(process.cwd(), ".env"),
]) {
  if (existsSync(candidate)) config({ path: candidate });
}
