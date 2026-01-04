import { useDemo } from "@/contexts/DemoContext";
import { usePermissions, PERMISSIONS } from "./usePermissions";

/**
 * Demo-aware permissions hook that grants full permissions to admin users in demo mode
 * Falls back to regular permissions when not in demo mode
 */
export function useDemoPermissions() {
  const { isDemoMode, demoUser } = useDemo();
  const regularPermissions = usePermissions();

  // In demo mode with admin user, grant all permissions
  if (isDemoMode && demoUser?.role === "admin") {
    return {
      ...regularPermissions,
      permissions: Object.values(PERMISSIONS),
      isLoading: false,
      isError: false,
      isAdmin: true,
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
      hasRole: (role: string) => role === "admin" || role === "system_admin",
    };
  }

  // In demo mode with sales user, grant sales permissions
  if (isDemoMode && demoUser?.role === "sales") {
    const salesPermissions = [
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.ASSIGN_TECHNICIANS,
      PERMISSIONS.MANAGE_LOANER_VEHICLES,
      PERMISSIONS.VIEW_ALL_AGENTS_DATA,
    ];
    return {
      ...regularPermissions,
      permissions: salesPermissions,
      isLoading: false,
      isError: false,
      isAdmin: false,
      hasPermission: (permission: string) => salesPermissions.includes(permission),
      hasAnyPermission: (perms: string[]) =>
        perms.some((p) => salesPermissions.includes(p)),
      hasAllPermissions: (perms: string[]) =>
        perms.every((p) => salesPermissions.includes(p)),
      hasRole: (role: string) => role === "sales",
    };
  }

  // In demo mode with appraiser user, grant appraiser permissions
  if (isDemoMode && demoUser?.role === "appraiser") {
    const appraiserPermissions = [
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.ASSIGN_TECHNICIANS,
    ];
    return {
      ...regularPermissions,
      permissions: appraiserPermissions,
      isLoading: false,
      isError: false,
      isAdmin: false,
      hasPermission: (permission: string) =>
        appraiserPermissions.includes(permission),
      hasAnyPermission: (perms: string[]) =>
        perms.some((p) => appraiserPermissions.includes(p)),
      hasAllPermissions: (perms: string[]) =>
        perms.every((p) => appraiserPermissions.includes(p)),
      hasRole: (role: string) => role === "appraiser",
    };
  }

  // Not in demo mode, use regular permissions
  return regularPermissions;
}
