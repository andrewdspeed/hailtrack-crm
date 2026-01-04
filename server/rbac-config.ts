/**
 * RBAC Configuration
 * Defines default role-permission mappings for Hail Solutions Group CRM
 */

// Permission constants
export const PERMISSIONS = {
  // Financial (4 permissions)
  VIEW_FINANCIAL_DATA: 'view_financial_data',
  EDIT_FINANCIAL_DATA: 'edit_financial_data',
  APPROVE_PAYMENTS: 'approve_payments',
  MANAGE_INVOICES: 'manage_invoices',
  
  // Data Management (3 permissions)
  EXPORT_DATA: 'export_data',
  DELETE_RECORDS: 'delete_records',
  MANAGE_TAGS: 'manage_tags',
  
  // Operations (2 permissions)
  ASSIGN_TECHNICIANS: 'assign_technicians',
  MANAGE_LOANER_VEHICLES: 'manage_loaner_vehicles',
  
  // Analytics (2 permissions)
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_ALL_AGENTS_DATA: 'view_all_agents_data',
  
  // Administration (1 permission)
  MANAGE_USERS: 'manage_users',
} as const;

// Role constants
export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  ADMIN: 'admin',
  SALES: 'sales',
  APPRAISER: 'appraiser',
  ESTIMATOR: 'estimator',
  MARKETING: 'marketing',
  REPAIR_TECH: 'repair_tech',
} as const;

// Default role-permission mappings
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  // System Admin - Full access to everything
  [ROLES.SYSTEM_ADMIN]: [
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.EDIT_FINANCIAL_DATA,
    PERMISSIONS.APPROVE_PAYMENTS,
    PERMISSIONS.MANAGE_INVOICES,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.DELETE_RECORDS,
    PERMISSIONS.MANAGE_TAGS,
    PERMISSIONS.ASSIGN_TECHNICIANS,
    PERMISSIONS.MANAGE_LOANER_VEHICLES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ALL_AGENTS_DATA,
    PERMISSIONS.MANAGE_USERS,
  ],
  
  // Admin (Kelgin Bradford) - All except user management
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.EDIT_FINANCIAL_DATA,
    PERMISSIONS.APPROVE_PAYMENTS,
    PERMISSIONS.MANAGE_INVOICES,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.DELETE_RECORDS,
    PERMISSIONS.MANAGE_TAGS,
    PERMISSIONS.ASSIGN_TECHNICIANS,
    PERMISSIONS.MANAGE_LOANER_VEHICLES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ALL_AGENTS_DATA,
    // Note: No MANAGE_USERS - only System Admin can manage users
  ],
  
  // Sales - Field operations, limited financial view
  [ROLES.SALES]: [
    PERMISSIONS.VIEW_FINANCIAL_DATA, // Can see estimates but not edit
    PERMISSIONS.EXPORT_DATA, // Export lead data for reporting
    PERMISSIONS.VIEW_ANALYTICS, // View performance metrics
    // Note: Cannot edit financial data, only view
    // Note: Cannot see other agents' data unless granted explicitly
  ],
  
  // Appraiser - Damage assessment and estimates
  [ROLES.APPRAISER]: [
    PERMISSIONS.VIEW_FINANCIAL_DATA, // View estimates during inspection
    PERMISSIONS.ASSIGN_TECHNICIANS, // Assign repair work
    PERMISSIONS.VIEW_ANALYTICS, // View inspection metrics
  ],
  
  // Estimator - Create and manage estimates/invoices
  [ROLES.ESTIMATOR]: [
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.EDIT_FINANCIAL_DATA, // Create/edit estimates
    PERMISSIONS.MANAGE_INVOICES, // Create/edit invoices
    PERMISSIONS.APPROVE_PAYMENTS, // Approve payment processing
    PERMISSIONS.EXPORT_DATA, // Export financial reports
    PERMISSIONS.VIEW_ANALYTICS, // View revenue metrics
  ],
  
  // Marketing/Digital - Analytics and lead source tracking
  [ROLES.MARKETING]: [
    PERMISSIONS.VIEW_ANALYTICS, // Full analytics access
    PERMISSIONS.EXPORT_DATA, // Export marketing data
    PERMISSIONS.MANAGE_TAGS, // Manage lead tags for campaigns
    PERMISSIONS.VIEW_ALL_AGENTS_DATA, // See all lead sources
    // Note: No financial data access
  ],
  
  // Repair Tech - Shop operations
  [ROLES.REPAIR_TECH]: [
    PERMISSIONS.ASSIGN_TECHNICIANS, // Self-assignment to jobs
    PERMISSIONS.MANAGE_LOANER_VEHICLES, // Manage loaner inventory
    // Note: Very limited access - only operational needs
  ],
};

// Role descriptions for UI
export const ROLE_DESCRIPTIONS: Record<string, string> = {
  [ROLES.SYSTEM_ADMIN]: 'Full system access for advanced troubleshooting and configuration',
  [ROLES.ADMIN]: 'Complete business management access (owner/founder)',
  [ROLES.SALES]: 'Lead creation, customer management, and field operations',
  [ROLES.APPRAISER]: 'Damage assessment, inspection forms, and estimate viewing',
  [ROLES.ESTIMATOR]: 'Estimate creation, invoice management, and pricing control',
  [ROLES.MARKETING]: 'Analytics, lead source tracking, and campaign management',
  [ROLES.REPAIR_TECH]: 'Shop operations, parts tracking, and repair status updates',
};

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  [PERMISSIONS.VIEW_FINANCIAL_DATA]: 'View estimates, invoices, and pricing information',
  [PERMISSIONS.EDIT_FINANCIAL_DATA]: 'Create and edit estimates and pricing',
  [PERMISSIONS.APPROVE_PAYMENTS]: 'Approve payment processing and transactions',
  [PERMISSIONS.MANAGE_INVOICES]: 'Create, edit, and manage invoices',
  [PERMISSIONS.EXPORT_DATA]: 'Export data to CSV, Excel, or other formats',
  [PERMISSIONS.DELETE_RECORDS]: 'Delete leads, customers, and other records',
  [PERMISSIONS.MANAGE_TAGS]: 'Create, edit, and delete lead tags',
  [PERMISSIONS.ASSIGN_TECHNICIANS]: 'Assign technicians to repair jobs',
  [PERMISSIONS.MANAGE_LOANER_VEHICLES]: 'Manage loaner vehicle inventory and assignments',
  [PERMISSIONS.VIEW_ANALYTICS]: 'Access analytics dashboard and reports',
  [PERMISSIONS.VIEW_ALL_AGENTS_DATA]: 'View data from all agents (not just own)',
  [PERMISSIONS.MANAGE_USERS]: 'Manage user accounts, roles, and permissions',
};

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES = {
  financial: [
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.EDIT_FINANCIAL_DATA,
    PERMISSIONS.APPROVE_PAYMENTS,
    PERMISSIONS.MANAGE_INVOICES,
  ],
  data: [
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.DELETE_RECORDS,
    PERMISSIONS.MANAGE_TAGS,
  ],
  operations: [
    PERMISSIONS.ASSIGN_TECHNICIANS,
    PERMISSIONS.MANAGE_LOANER_VEHICLES,
  ],
  analytics: [
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ALL_AGENTS_DATA,
  ],
  administration: [
    PERMISSIONS.MANAGE_USERS,
  ],
};

// Helper to get all permissions for a role
export function getRolePermissions(roleName: string): string[] {
  return DEFAULT_ROLE_PERMISSIONS[roleName] || [];
}

// Helper to check if a role has a specific permission
export function roleHasPermission(roleName: string, permission: string): boolean {
  const permissions = getRolePermissions(roleName);
  return permissions.includes(permission);
}

// Get all unique permissions across all roles
export function getAllPermissions(): string[] {
  return Object.values(PERMISSIONS);
}

// Get all role names
export function getAllRoles(): string[] {
  return Object.values(ROLES);
}
