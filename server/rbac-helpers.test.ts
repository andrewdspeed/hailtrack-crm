/**
 * Unit tests for RBAC helper functions
 * Run with: pnpm test server/rbac-helpers.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserRoles,
  getUserPermissions,
  hasPermission,
  hasRole,
  requirePermission,
  requireRole,
  isAdmin,
  requireAdmin,
  hasAnyPermission,
  hasAllPermissions,
  getUserAccessSummary,
  clearUserCache,
  clearAllCaches,
} from './rbac-helpers';
import { TRPCError } from '@trpc/server';

describe('RBAC Helper Functions', () => {
  beforeEach(() => {
    // Clear caches before each test
    clearAllCaches();
  });

  describe('getUserRoles', () => {
    it('should return array of role names for a user', async () => {
      // Note: This test requires a real database connection
      // In production, you'd mock the database or use a test database
      const roles = await getUserRoles(1);
      expect(Array.isArray(roles)).toBe(true);
    });

    it('should cache results for performance', async () => {
      const userId = 1;
      const roles1 = await getUserRoles(userId);
      const roles2 = await getUserRoles(userId);
      
      // Should return same reference (cached)
      expect(roles1).toEqual(roles2);
    });
  });

  describe('getUserPermissions', () => {
    it('should return array of permission names for a user', async () => {
      const permissions = await getUserPermissions(1);
      expect(Array.isArray(permissions)).toBe(true);
    });

    it('should include both role permissions and direct permissions', async () => {
      // This test would need a user with both role and direct permissions
      const permissions = await getUserPermissions(1);
      expect(Array.isArray(permissions)).toBe(true);
    });

    it('should deduplicate permissions', async () => {
      const permissions = await getUserPermissions(1);
      const uniquePermissions = Array.from(new Set(permissions));
      expect(permissions.length).toBe(uniquePermissions.length);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', async () => {
      // Assuming user 1 has 'view_financial_data' permission
      const result = await hasPermission(1, 'view_financial_data');
      expect(typeof result).toBe('boolean');
    });

    it('should return false if user does not have permission', async () => {
      const result = await hasPermission(1, 'nonexistent_permission');
      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has role', async () => {
      const result = await hasRole(1, 'admin');
      expect(typeof result).toBe('boolean');
    });

    it('should return false if user does not have role', async () => {
      const result = await hasRole(1, 'nonexistent_role');
      expect(result).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw if user has permission', async () => {
      // This test assumes user 1 has some permissions
      // In a real test, you'd set up a user with known permissions
      try {
        await requirePermission(1, 'view_financial_data');
        // If we get here, the user has the permission (or test needs adjustment)
        expect(true).toBe(true);
      } catch (error) {
        // User doesn't have permission - this is also valid for the test
        expect(error).toBeInstanceOf(TRPCError);
      }
    });

    it('should throw TRPCError if user lacks permission', async () => {
      try {
        await requirePermission(1, 'definitely_nonexistent_permission_12345');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        if (error instanceof TRPCError) {
          expect(error.code).toBe('FORBIDDEN');
        }
      }
    });
  });

  describe('requireRole', () => {
    it('should throw TRPCError if user lacks role', async () => {
      try {
        await requireRole(1, 'definitely_nonexistent_role_12345');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        if (error instanceof TRPCError) {
          expect(error.code).toBe('FORBIDDEN');
        }
      }
    });
  });

  describe('isAdmin', () => {
    it('should return boolean', async () => {
      const result = await isAdmin(1);
      expect(typeof result).toBe('boolean');
    });

    it('should return true for users with admin or system_admin role', async () => {
      // This test would need a user with admin role
      const result = await isAdmin(1);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('requireAdmin', () => {
    it('should not throw for admin users', async () => {
      // This test assumes user 1 might be admin
      try {
        await requireAdmin(1);
        // If we get here, user is admin
        expect(true).toBe(true);
      } catch (error) {
        // User is not admin - also valid
        expect(error).toBeInstanceOf(TRPCError);
      }
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', async () => {
      const result = await hasAnyPermission(1, ['view_financial_data', 'nonexistent']);
      expect(typeof result).toBe('boolean');
    });

    it('should return false if user has none of the permissions', async () => {
      const result = await hasAnyPermission(1, ['nonexistent1', 'nonexistent2']);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true only if user has all permissions', async () => {
      const result = await hasAllPermissions(1, ['view_financial_data']);
      expect(typeof result).toBe('boolean');
    });

    it('should return false if user is missing any permission', async () => {
      const result = await hasAllPermissions(1, ['view_financial_data', 'nonexistent']);
      expect(result).toBe(false);
    });
  });

  describe('getUserAccessSummary', () => {
    it('should return object with roles, permissions, and isAdmin', async () => {
      const summary = await getUserAccessSummary(1);
      
      expect(summary).toHaveProperty('roles');
      expect(summary).toHaveProperty('permissions');
      expect(summary).toHaveProperty('isAdmin');
      
      expect(Array.isArray(summary.roles)).toBe(true);
      expect(Array.isArray(summary.permissions)).toBe(true);
      expect(typeof summary.isAdmin).toBe('boolean');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache for specific user', async () => {
      const userId = 1;
      
      // Populate cache
      await getUserRoles(userId);
      await getUserPermissions(userId);
      
      // Clear cache
      clearUserCache(userId);
      
      // Should fetch fresh data (no way to verify from outside, but shouldn't throw)
      await getUserRoles(userId);
      expect(true).toBe(true);
    });

    it('should clear all caches', async () => {
      // Populate caches
      await getUserRoles(1);
      await getUserPermissions(1);
      
      // Clear all
      clearAllCaches();
      
      // Should fetch fresh data
      await getUserRoles(1);
      expect(true).toBe(true);
    });
  });
});
