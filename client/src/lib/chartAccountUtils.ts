import type { ChartAccount } from "@shared/schema";

/**
 * Extended ChartAccount type with children for tree structure
 */
export interface ChartAccountNode extends ChartAccount {
  children: ChartAccountNode[];
}

/**
 * Build hierarchical tree structure from flat array of accounts
 * Optimized for BigData with O(n) complexity
 * 
 * @param accounts - Flat array of chart accounts
 * @returns Hierarchical tree structure with root accounts at top level
 */
export function buildAccountTree(accounts: ChartAccount[]): ChartAccountNode[] {
  // Create map for O(1) lookups
  const accountMap = new Map<string, ChartAccountNode>();
  const rootAccounts: ChartAccountNode[] = [];

  // First pass: create nodes with empty children arrays
  accounts.forEach(account => {
    accountMap.set(account.id, { ...account, children: [] });
  });

  // Second pass: build tree structure
  accounts.forEach(account => {
    const node = accountMap.get(account.id)!;
    
    if (account.parentId === null) {
      // Root account
      rootAccounts.push(node);
    } else {
      // Child account: add to parent's children
      const parent = accountMap.get(account.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found (shouldn't happen with valid data)
        // Treat as root to prevent data loss
        rootAccounts.push(node);
      }
    }
  });

  // Tree is already ordered by path from backend query
  return rootAccounts;
}

/**
 * Get all ancestor IDs for a given account (bottom-up)
 * Used for breadcrumb navigation and path highlighting
 * 
 * @param accountId - ID of the account
 * @param accounts - Flat array of all accounts
 * @returns Array of ancestor IDs from root to account (inclusive)
 */
export function getAccountAncestors(accountId: string, accounts: ChartAccount[]): string[] {
  const ancestors: string[] = [];
  const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
  
  let current = accountMap.get(accountId);
  while (current) {
    ancestors.unshift(current.id);
    current = current.parentId ? accountMap.get(current.parentId) : undefined;
  }
  
  return ancestors;
}

/**
 * Get all descendant IDs for a given account (top-down)
 * Used for bulk operations like deleting subtrees
 * 
 * @param accountId - ID of the parent account
 * @param accounts - Flat array of all accounts
 * @returns Array of descendant IDs (excluding parent itself)
 */
export function getAccountDescendants(accountId: string, accounts: ChartAccount[]): string[] {
  const descendants: string[] = [];
  const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
  
  function collectDescendants(parentId: string) {
    accounts.forEach(account => {
      if (account.parentId === parentId) {
        descendants.push(account.id);
        collectDescendants(account.id);
      }
    });
  }
  
  collectDescendants(accountId);
  return descendants;
}

/**
 * Check if an account has children
 * 
 * @param accountId - ID of the account
 * @param accounts - Flat array of all accounts
 * @returns True if account has at least one child
 */
export function hasChildren(accountId: string, accounts: ChartAccount[]): boolean {
  return accounts.some(acc => acc.parentId === accountId);
}

/**
 * Get color for account type
 * Visual consistency across the app
 */
export function getAccountTypeColor(type: string): string {
  const colors: Record<string, string> = {
    receita: "#10B981", // green-500
    despesa: "#EF4444", // red-500
    ativo: "#3B82F6", // blue-500
    passivo: "#F59E0B", // amber-500
    patrimonio_liquido: "#8B5CF6", // violet-500
  };
  return colors[type] || "#6B7280"; // gray-500 as fallback
}

/**
 * Get icon name for account type (Lucide React)
 */
export function getAccountTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    receita: "TrendingUp",
    despesa: "TrendingDown",
    ativo: "Wallet",
    passivo: "CreditCard",
    patrimonio_liquido: "PiggyBank",
  };
  return icons[type] || "Folder";
}
