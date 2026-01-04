/**
 * RBAC Management API Router
 * Provides endpoints for managing roles, permissions, and user assignments
 */

import { router, publicProcedure, protectedProcedure } from './_core/trpc';
import { adminProcedure, manageUsersProcedure } from './rbac-middleware';
import { z } from 'zod';
import { getDb } from './db';
import { roles, permissions, userRoles, userPermissions, rolePermissions, users } from '../drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getUserRoles, getUserPermissions, clearUserCache, clearAllCaches } from './rbac-helpers';
import { PERMISSION_CATEGORIES, ROLE_DESCRIPTIONS, PERMISSION_DESCRIPTIONS } from './rbac-config';

export const rbacRouter = router({
  /**
   * Get all roles
   */
  getRoles: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    
    const allRoles = await db.select().from(roles);
    
    // Add descriptions
    return allRoles.map(role => ({
      ...role,
      description: ROLE_DESCRIPTIONS[role.name] || '',
    }));
  }),

  /**
   * Get all permissions (grouped by category)
   */
  getPermissions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    
    const allPermissions = await db.select().from(permissions);
    
    // Add descriptions and group by category
    const permissionsWithDetails = allPermissions.map(perm => ({
      ...perm,
      description: PERMISSION_DESCRIPTIONS[perm.name] || '',
    }));
    
    // Group by category
    const grouped: Record<string, typeof permissionsWithDetails> = {};
    for (const perm of permissionsWithDetails) {
      const category = perm.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(perm);
    }
    
    return {
      all: permissionsWithDetails,
      byCategory: grouped,
    };
  }),

  /**
   * Get roles assigned to a specific user
   */
  getUserRoles: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const roleNames = await getUserRoles(input.userId);
      return roleNames;
    }),

  /**
   * Get all permissions for a specific user (from roles + direct)
   */
  getUserPermissions: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      // If no userId provided, use current user
      const userId = input.userId || ctx.user.id;
      const permissionNames = await getUserPermissions(userId);
      return permissionNames;
    }),

  /**
   * Get current user's permissions (convenience endpoint)
   */
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    const permissionNames = await getUserPermissions(ctx.user.id);
    return permissionNames;
  }),

  /**
   * Assign a role to a user (admin only)
   */
  assignRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        roleId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      // Check if assignment already exists
      const existing = await db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, input.userId), eq(userRoles.roleId, input.roleId)));
      
      if (existing.length > 0) {
        throw new Error('User already has this role');
      }
      
      // Create assignment
      await db.insert(userRoles).values({
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: ctx.user.id,
      });
      
      // Clear cache
      clearUserCache(input.userId);
      
      return { success: true };
    }),

  /**
   * Remove a role from a user (admin only)
   */
  removeRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        roleId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      await db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, input.userId), eq(userRoles.roleId, input.roleId)));
      
      // Clear cache
      clearUserCache(input.userId);
      
      return { success: true };
    }),

  /**
   * Grant a direct permission to a user (admin only)
   */
  grantPermission: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        permissionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      // Check if permission already granted
      const existing = await db
        .select()
        .from(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, input.userId),
            eq(userPermissions.permissionId, input.permissionId)
          )
        );
      
      if (existing.length > 0) {
        throw new Error('User already has this permission');
      }
      
      // Grant permission
      await db.insert(userPermissions).values({
        userId: input.userId,
        permissionId: input.permissionId,
        assignedBy: ctx.user.id,
      });
      
      // Clear cache
      clearUserCache(input.userId);
      
      return { success: true };
    }),

  /**
   * Revoke a direct permission from a user (admin only)
   */
  revokePermission: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        permissionId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      await db
        .delete(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, input.userId),
            eq(userPermissions.permissionId, input.permissionId)
          )
        );
      
      // Clear cache
      clearUserCache(input.userId);
      
      return { success: true };
    }),

  /**
   * List all users with their roles (admin only)
   */
  listUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    
    // Get all users
    const allUsers = await db.select().from(users);
    
    // Get roles for each user
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        const roleNames = await getUserRoles(user.id);
        const permissionNames = await getUserPermissions(user.id);
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: roleNames,
          permissionCount: permissionNames.length,
          lastSignedIn: user.lastSignedIn,
          createdAt: user.createdAt,
        };
      })
    );
    
    return usersWithRoles;
  }),

  /**
   * Get detailed user access information (admin only)
   */
  getUserDetails: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      // Get user info
      const user = await db.select().from(users).where(eq(users.id, input.userId));
      
      if (user.length === 0) {
        throw new Error('User not found');
      }
      
      // Get user's roles with details
      const userRoleRecords = await db
        .select({
          roleId: roles.id,
          roleName: roles.name,
          roleDescription: roles.description,
          assignedAt: userRoles.assignedAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, input.userId));
      
      // Get user's direct permissions
      const directPermissionRecords = await db
        .select({
          permissionId: permissions.id,
          permissionName: permissions.name,
          permissionDescription: permissions.description,
          permissionCategory: permissions.category,
          assignedAt: userPermissions.assignedAt,
        })
        .from(userPermissions)
        .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
        .where(eq(userPermissions.userId, input.userId));
      
      // Get all effective permissions
      const allPermissions = await getUserPermissions(input.userId);
      
      return {
        user: user[0],
        roles: userRoleRecords,
        directPermissions: directPermissionRecords,
        allPermissions,
      };
    }),

  /**
   * Bulk assign roles to a user (admin only)
   */
  bulkAssignRoles: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        roleIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      // Remove all existing roles
      await db.delete(userRoles).where(eq(userRoles.userId, input.userId));
      
      // Add new roles
      if (input.roleIds.length > 0) {
        await db.insert(userRoles).values(
          input.roleIds.map(roleId => ({
            userId: input.userId,
            roleId,
            assignedBy: ctx.user.id,
          }))
        );
      }
      
      // Clear cache
      clearUserCache(input.userId);
      
      return { success: true };
    }),
});
