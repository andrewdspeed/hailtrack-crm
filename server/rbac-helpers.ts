/**
 * RBAC Helper Functions
 * Provides utilities for checking user roles and permissions
 */

import { getDb } from './db';
import { roles, permissions, userRoles, userPermissions, rolePermissions } from '../drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// In-memory cache for performance (5-minute TTL)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const roleCache = new Map<number, CacheEntry<string[]>>();
const permissionCache = new Map<number, CacheEntry<string[]>>();

/**
 * Clear cache for a specific user (call after role/permission changes)
 */
export function clearUserCache(userId: number): void {
  roleCache.delete(userId);
  permissionCache.delete(userId);
}

/**
 * Clear all caches (call after bulk changes)
 */
export function clearAllCaches(): void {
  roleCache.clear();
  permissionCache.clear();
}

/**
 * Get cache entry if valid, otherwise return null
 */
function getCached<T>(cache: Map<number, CacheEntry<T>>, key: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set cache entry
 */
function setCached<T>(cache: Map<number, CacheEntry<T>>, key: number, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Get all roles assigned to a user
 * @param userId - User ID
 * @returns Array of role names (e.g., ['admin', 'sales'])
 */
export async function getUserRoles(userId: number): Promise<string[]> {
  // Check cache first
  const cached = getCached(roleCache, userId);
  if (cached) return cached;
  
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Query user's roles
  const userRoleRecords = await db
    .select({
      roleName: roles.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
  
  const roleNames = userRoleRecords.map(r => r.roleName);
  
  // Cache the result
  setCached(roleCache, userId, roleNames);
  
  return roleNames;
}

/**
 * Get all permissions for a user (from roles + direct permissions)
 * @param userId - User ID
 * @returns Array of permission names (e.g., ['view_financial_data', 'export_data'])
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  // Check cache first
  const cached = getCached(permissionCache, userId);
  if (cached) return cached;
  
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Get user's roles
  const userRoleRecords = await db
    .select({
      roleId: userRoles.roleId,
    })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  
  const roleIds = userRoleRecords.map(r => r.roleId);
  
  // Get permissions from roles
  let rolePermissionNames: string[] = [];
  if (roleIds.length > 0) {
    const rolePermissionRecords = await db
      .select({
        permissionName: permissions.name,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds));
    
    rolePermissionNames = rolePermissionRecords.map(p => p.permissionName);
  }
  
  // Get direct user permissions (overrides)
  const directPermissionRecords = await db
    .select({
      permissionName: permissions.name,
    })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId));
  
  const directPermissionNames = directPermissionRecords.map(p => p.permissionName);
  
  // Combine and deduplicate
  const allPermissions = Array.from(new Set([...rolePermissionNames, ...directPermissionNames]));
  
  // Cache the result
  setCached(permissionCache, userId, allPermissions);
  
  return allPermissions;
}

/**
 * Check if user has a specific permission
 * @param userId - User ID
 * @param permission - Permission name (e.g., 'view_financial_data')
 * @returns true if user has the permission
 */
export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return userPerms.includes(permission);
}

/**
 * Check if user has a specific role
 * @param userId - User ID
 * @param role - Role name (e.g., 'admin')
 * @returns true if user has the role
 */
export async function hasRole(userId: number, role: string): Promise<boolean> {
  const userRolesList = await getUserRoles(userId);
  return userRolesList.includes(role);
}

/**
 * Require a specific permission (throws error if user doesn't have it)
 * @param userId - User ID
 * @param permission - Permission name
 * @throws TRPCError with code FORBIDDEN if user doesn't have permission
 */
export async function requirePermission(userId: number, permission: string): Promise<void> {
  const hasIt = await hasPermission(userId, permission);
  
  if (!hasIt) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You don't have permission to perform this action. Required permission: ${permission}`,
    });
  }
}

/**
 * Require a specific role (throws error if user doesn't have it)
 * @param userId - User ID
 * @param role - Role name
 * @throws TRPCError with code FORBIDDEN if user doesn't have role
 */
export async function requireRole(userId: number, role: string): Promise<void> {
  const hasIt = await hasRole(userId, role);
  
  if (!hasIt) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You don't have the required role to perform this action. Required role: ${role}`,
    });
  }
}

/**
 * Check if user is admin (has 'admin' or 'system_admin' role)
 * @param userId - User ID
 * @returns true if user is admin
 */
export async function isAdmin(userId: number): Promise<boolean> {
  const userRolesList = await getUserRoles(userId);
  return userRolesList.includes('admin') || userRolesList.includes('system_admin');
}

/**
 * Require admin role (throws error if user is not admin)
 * @param userId - User ID
 * @throws TRPCError with code FORBIDDEN if user is not admin
 */
export async function requireAdmin(userId: number): Promise<void> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an administrator to perform this action.',
    });
  }
}

/**
 * Check if user has ANY of the specified permissions
 * @param userId - User ID
 * @param permissionList - Array of permission names
 * @returns true if user has at least one of the permissions
 */
export async function hasAnyPermission(userId: number, permissionList: string[]): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return permissionList.some(p => userPerms.includes(p));
}

/**
 * Check if user has ALL of the specified permissions
 * @param userId - User ID
 * @param permissionList - Array of permission names
 * @returns true if user has all of the permissions
 */
export async function hasAllPermissions(userId: number, permissionList: string[]): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return permissionList.every(p => userPerms.includes(p));
}

/**
 * Get user's role and permission summary (for debugging/UI)
 * @param userId - User ID
 * @returns Object with roles and permissions
 */
export async function getUserAccessSummary(userId: number): Promise<{
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
}> {
  const [userRolesList, userPerms, admin] = await Promise.all([
    getUserRoles(userId),
    getUserPermissions(userId),
    isAdmin(userId),
  ]);
  
  return {
    roles: userRolesList,
    permissions: userPerms,
    isAdmin: admin,
  };
}
