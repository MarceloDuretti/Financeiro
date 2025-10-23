-- Migration: Plano de Contas (Chart of Accounts)
-- Date: 2025-10-23
-- Description: Hierarchical chart of accounts with auto-generated codes,
--              materialized path pattern for O(1) queries, and full multi-tenant isolation.
--
-- Features:
-- - Self-referencing parent-child relationships (unlimited depth)
-- - Materialized path (path column) for fast subtree queries
-- - Auto-generated hierarchical codes (1, 1.1, 1.1.1) using advisory locks
-- - Full-path names pre-computed for UX (e.g., "Receitas > Vendas > Vendas à Vista")
-- - Soft-delete with version control for incremental sync
-- - Row-Level Security (RLS) for multi-tenant data isolation
-- - Composite indexes optimized for BigData scenarios

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  -- Primary key
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Multi-tenant isolation
  tenant_id VARCHAR NOT NULL,
  
  -- Hierarchical structure
  parent_id VARCHAR REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  
  -- Auto-generated hierarchical code (stored as string, e.g., "1", "1.1", "1.1.1")
  -- Format: {parent_code}.{sequential_number}
  code VARCHAR NOT NULL,
  
  -- Materialized path for fast subtree queries (e.g., "1.2.3")
  -- Same as code, but explicitly used for path-based queries
  path VARCHAR NOT NULL,
  
  -- Depth level (0 for root, 1 for first level, etc.)
  -- Cached for performance and validation (max depth = 5)
  depth INTEGER NOT NULL DEFAULT 0,
  
  -- Full path name for UX (e.g., "Receitas > Vendas > Vendas à Vista")
  -- Pre-computed to avoid joins in UI
  full_path_name VARCHAR NOT NULL,
  
  -- Account attributes
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('receita', 'despesa', 'ativo', 'passivo', 'patrimonio_liquido')),
  
  -- Audit fields (mandatory architecture)
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT check_depth_limit CHECK (depth <= 5)
);

-- ============================================================================
-- 2. INDEXES (Composite indexes for multi-tenant BigData performance)
-- ============================================================================

-- Primary query: Get all accounts for a tenant, ordered by path
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant_path 
  ON chart_of_accounts(tenant_id, path);

-- Parent-child navigation: Get all children of a parent for a tenant
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant_parent_code 
  ON chart_of_accounts(tenant_id, parent_id, code);

-- Soft-delete filtering: Get non-deleted accounts by depth
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant_deleted_depth 
  ON chart_of_accounts(tenant_id, deleted, depth);

-- Type filtering: Get accounts by type for a tenant
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant_type 
  ON chart_of_accounts(tenant_id, type);

-- Incremental sync: Get accounts modified after timestamp
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant_updated 
  ON chart_of_accounts(tenant_id, updated_at);

-- Code uniqueness per tenant + parent
CREATE UNIQUE INDEX IF NOT EXISTS idx_chart_accounts_unique_code 
  ON chart_of_accounts(tenant_id, parent_id, code) 
  WHERE deleted = FALSE;

-- Name uniqueness per tenant + parent (same level)
-- Prevents duplicate names like "Vendas" under the same parent
CREATE UNIQUE INDEX IF NOT EXISTS idx_chart_accounts_unique_name_per_parent 
  ON chart_of_accounts(tenant_id, COALESCE(parent_id, ''), LOWER(name)) 
  WHERE deleted = FALSE;

-- ============================================================================
-- 3. ROW-LEVEL SECURITY (RLS) - Multi-Tenant Isolation
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant's data
CREATE POLICY chart_accounts_tenant_isolation ON chart_of_accounts
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::VARCHAR);

-- Policy: Users can only insert data for their own tenant
CREATE POLICY chart_accounts_tenant_insert ON chart_of_accounts
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', TRUE)::VARCHAR);

-- Policy: Users can only update their own tenant's data
CREATE POLICY chart_accounts_tenant_update ON chart_of_accounts
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::VARCHAR);

-- Policy: Users can only delete their own tenant's data
CREATE POLICY chart_accounts_tenant_delete ON chart_of_accounts
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::VARCHAR);

-- ============================================================================
-- 4. FUNCTIONS - Auto-increment version on update
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_chart_account_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_chart_account_version
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION increment_chart_account_version();

-- ============================================================================
-- 5. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE chart_of_accounts IS 
  'Hierarchical chart of accounts with materialized path pattern and auto-generated codes';

COMMENT ON COLUMN chart_of_accounts.tenant_id IS 
  'Multi-tenant isolation: each admin is a separate tenant';

COMMENT ON COLUMN chart_of_accounts.parent_id IS 
  'Self-referencing foreign key for tree structure. NULL = root account';

COMMENT ON COLUMN chart_of_accounts.code IS 
  'Auto-generated hierarchical code (e.g., "1", "1.1", "1.1.1"). Format: {parent_code}.{sequential}';

COMMENT ON COLUMN chart_of_accounts.path IS 
  'Materialized path for fast subtree queries. Same as code, but used explicitly in WHERE clauses';

COMMENT ON COLUMN chart_of_accounts.depth IS 
  'Cached depth level (0=root, 1=first level, etc.). Max depth = 5';

COMMENT ON COLUMN chart_of_accounts.full_path_name IS 
  'Pre-computed full path for UX (e.g., "Receitas > Vendas > Vendas à Vista")';

COMMENT ON COLUMN chart_of_accounts.type IS 
  'Account type: receita, despesa, ativo, passivo, patrimonio_liquido';

COMMENT ON COLUMN chart_of_accounts.deleted IS 
  'Soft-delete flag. TRUE = deleted, FALSE = active';

COMMENT ON COLUMN chart_of_accounts.version IS 
  'Optimistic locking version. Incremented atomically on every update';

-- ============================================================================
-- 6. VALIDATION FUNCTION - Prevent cycles in the tree
-- ============================================================================

CREATE OR REPLACE FUNCTION check_chart_account_cycle()
RETURNS TRIGGER AS $$
DECLARE
  current_id VARCHAR;
  visited_ids VARCHAR[] := ARRAY[]::VARCHAR[];
BEGIN
  -- Only check if parent_id is being set
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  current_id := NEW.parent_id;
  
  -- Follow the parent chain up to root
  WHILE current_id IS NOT NULL LOOP
    -- Check if we've seen this ID before (cycle detected)
    IF current_id = NEW.id THEN
      RAISE EXCEPTION 'Cycle detected: account cannot be its own ancestor';
    END IF;
    
    IF current_id = ANY(visited_ids) THEN
      RAISE EXCEPTION 'Cycle detected in account hierarchy';
    END IF;
    
    visited_ids := visited_ids || current_id;
    
    -- Get next parent
    SELECT parent_id INTO current_id
    FROM chart_of_accounts
    WHERE id = current_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_chart_account_cycle
  BEFORE INSERT OR UPDATE ON chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION check_chart_account_cycle();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run `npm run db:push --force` to apply schema changes
-- 2. Backend creates accounts using advisory locks (pg_advisory_xact_lock)
-- 3. Frontend renders tree using buildAccountTree() helper
-- 4. RLS policies enforce tenant isolation at database level
-- ============================================================================
