/**
 * Build the Vercel serverless handler and place it at:
 *   api/trpc/[...path].js   (catch-all route for /api/trpc/*)
 *   api/health.js            (simple health check)
 *
 * Vercel's catch-all file routing invokes api/trpc/[...path].js for ALL
 * requests to /api/trpc/* and preserves req.url so Express routing works.
 * This eliminates the need for URL-mangling rewrites entirely.
 */

import { build } from "esbuild";
import { mkdirSync, copyFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// 1. Build the handler bundle (CJS, external node_modules)
const outFile = resolve(root, "api/trpc/[...path].js");
mkdirSync(resolve(root, "api/trpc"), { recursive: true });

await build({
  entryPoints: [resolve(root, "server/vercel-handler.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  packages: "external",
  outfile: outFile,
  logLevel: "info",
});

// 2. The api/trpc/ dir needs its own package.json so Node treats the .js as CJS
//    (root package.json has "type":"module" which would make .js = ESM)
writeFileSync(
  resolve(root, "api/trpc/package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n"
);

console.log("Vercel handler built:", outFile);
