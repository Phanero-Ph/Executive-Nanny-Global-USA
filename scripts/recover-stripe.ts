import "dotenv/config";
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import path from "node:path";
import { pool } from "../src/db";
import { getStripe, stripeMode } from "../src/lib/stripe";
import { recoverStripeEvents } from "../src/lib/stripe-recovery";

function report(message: string) {
 const directory = path.resolve(".data");
 mkdirSync(directory, { recursive: true });
 const file = path.join(directory, "stripe-recovery.log");
 if (existsSync(file) && statSync(file).size > 1024 * 1024) renameSync(file, `${file}.previous`);
 const line = `${new Date().toISOString()} ${message}`;
 appendFileSync(file, line + "\n");
 console.log(line);
}

async function main() {
 // Validate the key and live-mode opt-in before making network requests.
 const stripe = getStripe();
 const connection = await pool.getConnection();
 const lock = `egn-stripe-recovery-${stripeMode()}`;
 let acquired = false;
 try {
  const [rows] = await connection.query("SELECT GET_LOCK(?, 0) AS acquired", [lock]);
  acquired = (rows as { acquired: number }[])[0].acquired === 1;
  if (!acquired) { report("Stripe recovery is already running; skipped."); return; }
  const result = await recoverStripeEvents(stripe);
  report(`Stripe recovery: ${JSON.stringify(result)}`);
  if (result.failed) process.exitCode = 1;
 } finally {
  if (acquired) await connection.query("SELECT RELEASE_LOCK(?)", [lock]);
  connection.release();
 }
}
main().catch(() => {
 report("Stripe recovery could not complete. Check database access, Stripe credentials and connectivity. The next scheduled run will retry.");
 process.exitCode = 1;
}).finally(() => pool.end());
