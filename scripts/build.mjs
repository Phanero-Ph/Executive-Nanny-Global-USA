import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// Limit both Next.js' process pool and Rust runtimes used by native build tools.
const env = {
  ...process.env,
  CIRCLE_NODE_TOTAL: "1",
  TOKIO_WORKER_THREADS: "1",
  RAYON_NUM_THREADS: "1",
};

console.log("Build concurrency capped: Next.js=1, Tokio=1, Rayon=1");

const nextCli = resolve("node_modules/next/dist/bin/next");
const result = spawnSync(process.execPath, [nextCli, "build", "--webpack"], {
  env,
  stdio: "inherit",
});

if (result.error) {
  console.error("Could not start the Next.js production build:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
