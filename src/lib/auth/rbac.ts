import { SystemRole, SYSTEM_ROLE_DEFINITIONS, PermissionCode, PERMISSIONS } from "./roles";

export { PERMISSIONS };
export type { PermissionCode };

/**
 * Check if a role possesses a specific permission
 */
export function roleHasPermission(role: SystemRole, permission: PermissionCode | string): boolean {
  const roleDef = SYSTEM_ROLE_DEFINITIONS[role];
  if (!roleDef) return false;
  return roleDef.permissions.includes(permission);
}

/**
 * Check if a role has any of the given permissions
 */
export function roleHasAnyPermission(role: SystemRole, permissions: (PermissionCode | string)[]): boolean {
  return permissions.some((perm) => roleHasPermission(role, perm));
}

/**
 * Check if a role has all of the given permissions
 */
export function roleHasAllPermissions(role: SystemRole, permissions: (PermissionCode | string)[]): boolean {
  return permissions.every((perm) => roleHasPermission(role, perm));
}

/**
 * Get all permissions for a given system role
 */
export function getPermissionsForRole(role: SystemRole): string[] {
  return SYSTEM_ROLE_DEFINITIONS[role]?.permissions || [];
}

/**
 * Check user object directly against permission requirement
 */
export interface AuthenticatedUserContext {
  id: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  activeRole: SystemRole;
  organizationId: string;
  customPermissions?: string[];
}

export function userCan(user: AuthenticatedUserContext, permission: PermissionCode | string): boolean {
  if (user.isSuperAdmin) return true;
  if (roleHasPermission(user.activeRole, permission)) return true;
  if (user.customPermissions && user.customPermissions.includes(permission)) return true;
  return false;
}

