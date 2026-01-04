/**
 * usePermissions Hook
 * Provides React components with easy access to user permissions and roles
 */

import { trpc } from '@/lib/trpc';

export interface PermissionsHook {
  permissions: string[] | undefined;
  roles: string[] | undefined;
  isLoading: boolean;
  isError: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  refetch: () => void;
}

/**
 * Hook to access current user's permissions and roles
 * 
 * @example
 * ```tsx
 * const { hasPermission, isAdmin, isLoading } = usePermissions();
 * 
 * if (isLoading) return <Spinner />;
 * 
 * if (hasPermission('view_financial_data')) {
 *   return <EstimatesTab />;
 * }
 * 
 * if (isAdmin) {
 *   return <AdminPanel />;
 * }
 * ```
 */
export function usePermissions(): PermissionsHook {
  // Fetch current user's permissions
  const { 
    data: permissions, 
    isLoading: permissionsLoading, 
    isError: permissionsError,
    refetch: refetchPermissions,
  } = trpc.rbac.getMyPermissions.useQuery();

  // Fetch current user's roles
  const { 
    data: roles, 
    isLoading: rolesLoading, 
    isError: rolesError,
    refetch: refetchRoles,
  } = trpc.rbac.getUserRoles.useQuery({ userId: 0 }); // 0 will use current user

  const isLoading = permissionsLoading || rolesLoading;
  const isError = permissionsError || rolesError;

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!permissions) return false;
    return permissions.includes(permission);
  };

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!permissions) return false;
    return permissionList.some(p => permissions.includes(p));
  };

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!permissions) return false;
    return permissionList.every(p => permissions.includes(p));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    if (!roles) return false;
    return roles.includes(role);
  };

  /**
   * Check if user is an admin (has 'admin' or 'system_admin' role)
   */
  const isAdmin = hasRole('admin') || hasRole('system_admin');

  /**
   * Refetch both permissions and roles
   */
  const refetch = () => {
    refetchPermissions();
    refetchRoles();
  };

  return {
    permissions,
    roles,
    isLoading,
    isError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    refetch,
  };
}

/**
 * Permission constants for easy reference
 * Import these instead of using string literals
 */
export const PERMISSIONS = {
  // Financial
  VIEW_FINANCIAL_DATA: 'view_financial_data',
  EDIT_FINANCIAL_DATA: 'edit_financial_data',
  APPROVE_PAYMENTS: 'approve_payments',
  MANAGE_INVOICES: 'manage_invoices',
  
  // Data Management
  EXPORT_DATA: 'export_data',
  DELETE_RECORDS: 'delete_records',
  MANAGE_TAGS: 'manage_tags',
  
  // Operations
  ASSIGN_TECHNICIANS: 'assign_technicians',
  MANAGE_LOANER_VEHICLES: 'manage_loaner_vehicles',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_ALL_AGENTS_DATA: 'view_all_agents_data',
  
  // Administration
  MANAGE_USERS: 'manage_users',
} as const;

/**
 * Role constants for easy reference
 */
export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  ADMIN: 'admin',
  SALES: 'sales',
  APPRAISER: 'appraiser',
  ESTIMATOR: 'estimator',
  MARKETING: 'marketing',
  REPAIR_TECH: 'repair_tech',
} as const;
