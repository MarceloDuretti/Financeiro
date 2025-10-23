import { pool } from "./db";
import type { User } from "@shared/schema";
import { getTenantId } from "./tenantUtils";

/**
 * Execute a database transaction with Row-Level Security (RLS) tenant isolation
 * 
 * This helper configures the PostgreSQL session with the tenant_id before executing queries.
 * All RLS policies will filter data based on this tenant_id automatically.
 * 
 * @param user - Authenticated user (admin or collaborator)
 * @param callback - Async function that executes queries within the RLS context
 * @returns Result of the callback function
 */
export async function withTenantContext<T>(
  user: User,
  callback: () => Promise<T>
): Promise<T> {
  const tenantId = getTenantId(user);
  const client = await pool.connect();
  
  try {
    // Set the tenant_id in the PostgreSQL session
    // This will be used by RLS policies to filter data
    await client.query("SELECT set_config('app.tenant_id', $1, false)", [tenantId]);
    
    // Execute the callback with the configured session
    return await callback();
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

/**
 * Check if Row-Level Security is enabled on a table
 * Useful for debugging and ensuring RLS is properly configured
 */
export async function checkRLSStatus(tableName: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT relrowsecurity FROM pg_class WHERE relname = $1`,
      [tableName]
    );
    return result.rows[0]?.relrowsecurity || false;
  } finally {
    client.release();
  }
}
