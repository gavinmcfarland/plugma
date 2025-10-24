#!/usr/bin/env node

import { spawnSync } from "child_process";

/**
 * Get the appropriate dist tag based on CLI args, environment variables, or development mode
 */
async function getDistTag() {
  // First check CLI args for --dist-tag
  const args = process.argv.slice(2);
  const distTagIndex = args.findIndex(arg => arg === '--dist-tag');
  if (distTagIndex !== -1 && args[distTagIndex + 1]) {
    return args[distTagIndex + 1];
  }

  // Then check environment variable
  if (process.env.DIST_TAG) return process.env.DIST_TAG;

  // Check if we're developing locally
  if (process.env.PLUGMA_DEVELOPING_LOCALLY === 'true') {
    return 'next';
  }

  return 'latest';
}

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

async function forwardToCreate(restArgs) {
  const pm = detectPM();
  const pkg = "create-plugma";
  // Get dist tag using the same logic as plugma
  const distTag = await getDistTag();
  const version = process.env.PLUGMA_CREATE_VERSION || distTag;
  const spec = `${pkg}@${version}`;

  // Set PLUGMA_DEVELOPING_LOCALLY for create-plugma to detect development mode
  // This matches the logic in the main CLI's preAction hook
  process.env.PLUGMA_DEVELOPING_LOCALLY = 'true';

  if (pm === "pnpm") return run("pnpm", ["dlx", spec, ...restArgs]);
  if (pm === "yarn") return run("yarn", ["dlx", spec, ...restArgs]);
  if (pm === "bun")  return run("bunx", [spec, ...restArgs]);
  // default to npm
  return run("npx", ["--yes", spec, ...restArgs]);
}

const args = process.argv.slice(2);

if (args[0] === "create") {
  await forwardToCreate(args.slice(1));
} else if (args[0] === "add") {
  // Forward add command to create-plugma as well
  await forwardToCreate(args);
} else {
  // Import and run the normal plugma CLI for other commands
  await import('../dist/bin/cli.js');
}
