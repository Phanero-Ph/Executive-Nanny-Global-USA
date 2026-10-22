import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !databaseUrl.startsWith("mysql://")) {
  throw new Error("DATABASE_URL must be a mysql:// connection URL. See .env.example.");
}
const globalForDb = globalThis as typeof globalThis & { __egnMysqlUtcPool?: Pool };
export const pool = globalForDb.__egnMysqlUtcPool ?? createPool({
  uri: databaseUrl,
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 50,
  charset: "utf8mb4",
  timezone: "Z",
});
if (!globalForDb.__egnMysqlUtcPool) pool.on("connection", connection => {
  connection.query("SET time_zone = '+00:00'");
});
if (process.env.NODE_ENV !== "production") globalForDb.__egnMysqlUtcPool = pool;
export const db = drizzle(pool);
