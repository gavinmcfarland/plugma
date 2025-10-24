#!/usr/bin/env node

import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function detectPM() {
  // works for npm/pnpm/yarn/bun when invoked via npx/dlx/etc.
  const ua = process.env.npm_config_user_agent || "";
  if (ua.includes("pnpm")) return "pnpm";
  if (ua.includes("yarn")) return "yarn";
  if (ua.includes("bun")) return "bun";
  return "npm";
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  process.exit(res.status ?? 0);
}

function forwardToCreate(restArgs) {
  const pm = detectPM();
  const pkg = "create-plugma";
  // Pin to the same version as plugma for consistency
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
  const version = process.env.PLUGMA_CREATE_VERSION || packageJson.version;
  const spec = `${pkg}@${version}`;

  if (pm === "pnpm") return run("pnpm", ["dlx", spec, ...restArgs]);
  if (pm === "yarn") return run("yarn", ["dlx", spec, ...restArgs]);
  if (pm === "bun")  return run("bunx", [spec, ...restArgs]);
  // default to npm
  return run("npx", ["--yes", spec, ...restArgs]);
}

const args = process.argv.slice(2);

if (args[0] === "create") {
  forwardToCreate(args.slice(1));
} else if (args[0] === "add") {
  // Forward add command to create-plugma as well
  forwardToCreate(args);
} else {
  // Import and run the normal plugma CLI for other commands
  await import('../dist/bin/cli.js');
}
