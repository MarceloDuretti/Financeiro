import type { User } from "@shared/schema";

/**
 * Extract tenantId from authenticated user
 * - Admin users: use their own ID as tenantId
 * - Collaborator users: use their adminId as tenantId
 * 
 * This ensures all operations are scoped to the admin's tenant,
 * providing complete data isolation in a multi-tenant architecture.
 */
export function getTenantId(user: User): string {
  if (!user) {
    throw new Error("User is not authenticated");
  }

  // Admin users are their own tenant
  if (user.role === "admin") {
    return user.id;
  }

  // Collaborators inherit their admin's tenant
  if (user.role === "collaborator" && user.adminId) {
    return user.adminId;
  }

  throw new Error("User does not have a valid tenant context");
}
