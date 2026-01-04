/**
 * RBAC Middleware for tRPC
 * Provides middleware wrappers to protect procedures with role/permission checks
 */

import { protectedProcedure } from './_core/trpc';
import { requirePermission, requireRole, requireAdmin } from './rbac-helpers';
import { PERMISSIONS, ROLES } from './rbac-config';

/**
 * Create a procedure that requires a specific permission
 * Usage: withPermission(PERMISSIONS.VIEW_FINANCIAL_DATA)
 */
export const withPermission = (permission: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    await requirePermission(ctx.user.id, permission);
    return next({ ctx });
  });

/**
 * Create a procedure that requires a specific role
 * Usage: withRole(ROLES.ADMIN)
 */
export const withRole = (role: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    await requireRole(ctx.user.id, role);
    return next({ ctx });
  });

/**
 * Procedure that requires admin role (admin or system_admin)
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  await requireAdmin(ctx.user.id);
  return next({ ctx });
});

/**
 * Procedure that requires permission to view financial data
 */
export const financialViewProcedure = withPermission(PERMISSIONS.VIEW_FINANCIAL_DATA);

/**
 * Procedure that requires permission to edit financial data
 */
export const financialEditProcedure = withPermission(PERMISSIONS.EDIT_FINANCIAL_DATA);

/**
 * Procedure that requires permission to approve payments
 */
export const paymentApproveProcedure = withPermission(PERMISSIONS.APPROVE_PAYMENTS);

/**
 * Procedure that requires permission to manage invoices
 */
export const invoiceManageProcedure = withPermission(PERMISSIONS.MANAGE_INVOICES);

/**
 * Procedure that requires permission to export data
 */
export const exportDataProcedure = withPermission(PERMISSIONS.EXPORT_DATA);

/**
 * Procedure that requires permission to delete records
 */
export const deleteRecordsProcedure = withPermission(PERMISSIONS.DELETE_RECORDS);

/**
 * Procedure that requires permission to manage tags
 */
export const manageTagsProcedure = withPermission(PERMISSIONS.MANAGE_TAGS);

/**
 * Procedure that requires permission to assign technicians
 */
export const assignTechniciansProcedure = withPermission(PERMISSIONS.ASSIGN_TECHNICIANS);

/**
 * Procedure that requires permission to manage loaner vehicles
 */
export const manageLoanersProcedure = withPermission(PERMISSIONS.MANAGE_LOANER_VEHICLES);

/**
 * Procedure that requires permission to view analytics
 */
export const analyticsProcedure = withPermission(PERMISSIONS.VIEW_ANALYTICS);

/**
 * Procedure that requires permission to view all agents' data
 */
export const viewAllAgentsProcedure = withPermission(PERMISSIONS.VIEW_ALL_AGENTS_DATA);

/**
 * Procedure that requires permission to manage users
 */
export const manageUsersProcedure = withPermission(PERMISSIONS.MANAGE_USERS);

// Role-specific procedures

/**
 * Procedure that requires System Admin role
 */
export const systemAdminProcedure = withRole(ROLES.SYSTEM_ADMIN);

/**
 * Procedure that requires Sales role
 */
export const salesProcedure = withRole(ROLES.SALES);

/**
 * Procedure that requires Appraiser role
 */
export const appraiserProcedure = withRole(ROLES.APPRAISER);

/**
 * Procedure that requires Estimator role
 */
export const estimatorProcedure = withRole(ROLES.ESTIMATOR);

/**
 * Procedure that requires Marketing role
 */
export const marketingProcedure = withRole(ROLES.MARKETING);

/**
 * Procedure that requires Repair Tech role
 */
export const repairTechProcedure = withRole(ROLES.REPAIR_TECH);

/**
 * Export all permission constants for easy access
 */
export { PERMISSIONS, ROLES };
