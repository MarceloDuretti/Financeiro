-- Migration: Código Automático (Integer Sequential)
-- Date: 2025-10-23
-- Description: Convert code columns from varchar to integer with automatic sequential generation

-- ========================================
-- STEP 1: Convert companies.code (varchar → integer)
-- ========================================

-- Drop existing index on code
DROP INDEX IF EXISTS companies_tenant_code_idx;

-- Convert existing varchar codes to sequential integers per tenant
WITH ranked AS (
  SELECT 
    id,
    tenant_id,
    ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY code) as new_code
  FROM companies
)
UPDATE companies c
SET code = ranked.new_code::varchar
FROM ranked
WHERE c.id = ranked.id;

-- Change column type to integer
ALTER TABLE companies 
ALTER COLUMN code TYPE integer USING code::integer;

-- Create unique index (tenant_id, code)
CREATE UNIQUE INDEX companies_tenant_code_unique ON companies(tenant_id, code);

-- ========================================
-- STEP 2: Convert categories.code (varchar → integer)
-- ========================================

-- Drop existing indexes
DROP INDEX IF EXISTS categories_tenant_code_idx;

-- Convert existing varchar codes to sequential integers per tenant+type
-- Receitas: REC001, REC002... → 1, 2...
-- Despesas: DES001, DES002... → 1, 2...
WITH ranked AS (
  SELECT 
    id,
    tenant_id,
    type,
    ROW_NUMBER() OVER (PARTITION BY tenant_id, type ORDER BY code) as new_code
  FROM categories
)
UPDATE categories c
SET code = ranked.new_code::varchar
FROM ranked
WHERE c.id = ranked.id;

-- Change column type to integer
ALTER TABLE categories 
ALTER COLUMN code TYPE integer USING code::integer;

-- Create unique composite index (tenant_id, code, type)
-- Note: Code is unique per tenant+type (REC001 and DES001 both have code=1)
CREATE UNIQUE INDEX categories_tenant_code_type_unique ON categories(tenant_id, code, type);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify companies codes
-- SELECT tenant_id, code, trade_name FROM companies ORDER BY tenant_id, code;

-- Verify categories codes  
-- SELECT tenant_id, type, code, name FROM categories ORDER BY tenant_id, type, code;

-- ========================================
-- ROLLBACK (if needed)
-- ========================================

-- WARNING: This is destructive and should only be used in emergencies
-- Rollback would require:
-- 1. ALTER COLUMN back to varchar
-- 2. Format codes back to EMP001, REC001, DES001
-- 3. Drop unique indexes and recreate regular indexes
-- Not recommended - instead use project rollback feature
