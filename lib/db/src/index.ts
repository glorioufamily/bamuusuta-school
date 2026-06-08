import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("[DB] Initializing PostgreSQL connection...");
console.log(`[DB] Connection string: postgresql://${process.env.DATABASE_URL?.split("@")[1] || "unknown"}`);

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Connection timeout
  connectionTimeoutMillis: 10000,
  // Idle timeout
  idleTimeoutMillis: 30000,
  // Max connections
  max: 20,
});

// Add error handlers
pool.on("error", (err: Error) => {
  console.error("[DB ERROR] Unexpected connection pool error:", err);
  process.exit(1);
});

pool.on("connect", () => {
  console.log("[DB] ✓ New connection acquired from pool");
});

pool.on("remove", () => {
  console.log("[DB] Connection removed from pool");
});

// Test connection immediately
pool.query("SELECT NOW()", (err: Error | null, res: any) => {
  if (err) {
    const pgErr = err as any;
    console.error("[DB CRITICAL] Failed to connect to database:", err.message);
    console.error("[DB DEBUG] Error details:", {
      code: pgErr.code || "UNKNOWN",
      message: err.message,
      detail: pgErr.detail || null,
    });
    process.exit(1);
  } else {
    console.log("[DB] ✓ Connection test successful. Server time:", res.rows[0].now);
  }
});

export const db = drizzle(pool, { schema });
export { pool };

export * from "./schema";
