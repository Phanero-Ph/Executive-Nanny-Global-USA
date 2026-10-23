import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const databaseUrl = process.env.DATABASE_URL?.trim();
const isProductionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
const hasDatabaseUrl = Boolean(databaseUrl?.startsWith("mysql://"));

if (!hasDatabaseUrl && !isProductionBuild) {
  throw new Error("DATABASE_URL must be a mysql:// connection URL. See .env.example.");
}

const globalForDb = globalThis as typeof globalThis & { __egnMysqlUtcPool?: ReturnType<typeof createPool> };

// Next imports route modules while collecting build metadata. Use Drizzle's mock
// client only during that phase when build hosts don't have runtime secrets.
// The production server still requires DATABASE_URL before it can serve queries.
export const pool = globalForDb.__egnMysqlUtcPool ?? createPool({
      // This inert connection string is used only while Next inspects routes
      // during a build that has no runtime database secrets.
      uri: databaseUrl ?? "mysql://build:build@127.0.0.1/build",
      connectionLimit: 5,
      waitForConnections: true,
      queueLimit: 50,
      charset: "utf8mb4",
      timezone: "Z",
    });

if (!globalForDb.__egnMysqlUtcPool) {
  pool.on("connection", connection => {
    connection.query("SET time_zone = '+00:00'");
  });
  if (process.env.NODE_ENV !== "production") globalForDb.__egnMysqlUtcPool = pool;
}

export const db = hasDatabaseUrl ? drizzle(pool) : drizzle.mock();
