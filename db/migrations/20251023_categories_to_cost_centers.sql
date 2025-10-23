-- Migration: Transform Categories into Cost Centers
-- Date: 2025-10-23
-- Description: Rename categories table to cost_centers and remove type field

-- Step 1: Rename the table
ALTER TABLE categories RENAME TO cost_centers;

-- Step 2: Drop the type field (Centro de Custo doesn't have type)
ALTER TABLE cost_centers DROP COLUMN type;

-- Step 3: Drop old indexes that included type
DROP INDEX IF EXISTS categories_tenant_code_type_unique;
DROP INDEX IF EXISTS categories_tenant_type_idx;
DROP INDEX IF EXISTS categories_tenant_idx;
DROP INDEX IF EXISTS categories_tenant_updated_idx;

-- Step 4: Create new indexes without type
CREATE INDEX cost_centers_tenant_idx ON cost_centers(tenant_id, deleted, id);
CREATE UNIQUE INDEX cost_centers_tenant_code_unique ON cost_centers(tenant_id, code);
CREATE INDEX cost_centers_tenant_updated_idx ON cost_centers(tenant_id, updated_at);

-- Migration complete: categories → cost_centers
