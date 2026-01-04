# RBAC System Guide
## Role-Based Access Control for Hail Solutions CRM

This document explains the complete RBAC (Role-Based Access Control) system implemented in the Hail Solutions CRM.

---

## Overview

The RBAC system provides fine-grained access control to protect sensitive business data and operations. It consists of:

- **7 Roles** with different access levels
- **12 Permissions** organized into 5 categories
- **Automatic permission enforcement** on both backend and frontend
- **User management interface** for admins

---

## Roles & Default Permissions

### 1. System Admin
**Full system access** for advanced troubleshooting and configuration.

**Permissions (12):**
- All permissions enabled

**Use Case:** Technical administrators, system troubleshooting

---

### 2. Admin (Business Owner)
**Complete business management** access except user administration.

**Permissions (11):**
- ✅ View Financial Data
- ✅ Edit Financial Data
- ✅ Approve Payments
- ✅ Manage Invoices
- ✅ Export Data
- ✅ Delete Records
- ✅ Manage Tags
- ✅ Assign Technicians
- ✅ Manage Loaner Vehicles
- ✅ View Analytics
- ✅ View All Agents Data
- ❌ Manage Users (System Admin only)

**Use Case:** Business owners (Kelgin Bradford), operations managers

---

### 3. Sales
**Lead creation and customer management** with limited financial visibility.

**Permissions (3):**
- ✅ View Financial Data (read-only estimates)
- ✅ Export Data
- ✅ View Analytics

**Use Case:** Field sales agents, lead generators

---

### 4. Appraiser
**Damage assessment and inspection** with estimate viewing.

**Permissions (3):**
- ✅ View Financial Data
- ✅ Assign Technicians
- ✅ View Analytics

**Use Case:** Vehicle damage appraisers, inspectors

---

### 5. Estimator
**Full financial control** for pricing and invoicing.

**Permissions (6):**
- ✅ View Financial Data
- ✅ Edit Financial Data
- ✅ Manage Invoices
- ✅ Approve Payments
- ✅ Export Data
- ✅ View Analytics

**Use Case:** Pricing specialists, invoice managers

---

### 6. Marketing/Digital
**Analytics and campaign management** without financial access.

**Permissions (4):**
- ✅ View Analytics
- ✅ Export Data
- ✅ Manage Tags
- ✅ View All Agents Data

**Use Case:** Marketing team, campaign managers, lead source analysts

---

### 7. Repair Tech
**Shop operations only** with minimal system access.

**Permissions (2):**
- ✅ Assign Technicians
- ✅ Manage Loaner Vehicles

**Use Case:** Shop technicians, repair staff

---

## Permission Categories

### Financial (4 permissions)
- **view_financial_data** - View estimates, invoices, and pricing
- **edit_financial_data** - Create and edit estimates and pricing
- **approve_payments** - Approve payment processing and transactions
- **manage_invoices** - Create, edit, and manage invoices

### Data Management (3 permissions)
- **export_data** - Export data to CSV, Excel, or other formats
- **delete_records** - Delete leads, customers, and other records
- **manage_tags** - Create, edit, and delete lead tags

### Operations (2 permissions)
- **assign_technicians** - Assign technicians to repair jobs
- **manage_loaner_vehicles** - Manage loaner vehicle inventory and assignments

### Analytics (2 permissions)
- **view_analytics** - Access analytics dashboard and reports
- **view_all_agents_data** - View data from all agents (not just own)

### Administration (1 permission)
- **manage_users** - Manage user accounts, roles, and permissions

---

## Protected Features

### Backend API Protection
The following API endpoints are automatically protected:

**Financial Data:**
- `estimates.create` → requires `edit_financial_data`
- `estimates.getByLeadId` → requires `view_financial_data`
- `estimates.updateStatus` → requires `edit_financial_data`
- `estimates.delete` → requires `delete_records`
- `estimates.convertToInvoice` → requires `manage_invoices`
- `invoices.create` → requires `manage_invoices`
- `invoices.getByLeadId` → requires `view_financial_data`
- `invoices.recordPayment` → requires `approve_payments`

**Analytics:**
- All `analytics.*` routes → require `view_analytics`

**Data Export:**
- `spreadsheet.getAllWithDetails` → requires `export_data`

**Delete Operations:**
- All `*.delete` routes → require `delete_records`

### Frontend UI Protection

**Hidden Elements:**
- Estimates & Invoices section (LeadDetail) → hidden if no `view_financial_data`
- Analytics page → access denied if no `view_analytics`
- User Management button → hidden if not admin
- Delete buttons → hidden if no `delete_records`

---

## User Management

### Accessing User Management
1. Log in as an admin user
2. Click the **Shield icon** in the top-right header
3. Or navigate to `/users`

### Assigning Roles
1. Go to User Management page
2. Find the user in the list
3. Click **"Edit Roles"** button
4. Check/uncheck roles in the dialog
5. Click **"Save Changes"**

### Role Assignment Best Practices
- **One primary role** per user (avoid role overlap)
- **Grant least privilege** - only assign necessary permissions
- **Review quarterly** - audit user access regularly
- **Document exceptions** - note any custom permission grants

---

## Testing RBAC

### Test User Setup
Create test users with different roles to verify access control:

```sql
-- Example: Create a sales user and assign role
INSERT INTO user_roles (userId, roleId, assignedBy)
SELECT 
  (SELECT id FROM users WHERE email = 'sales@test.com'),
  (SELECT id FROM roles WHERE name = 'sales'),
  1; -- Admin user ID
```

### Test Scenarios

#### 1. Financial Data Protection
- **Sales user** should see estimates but NOT edit them
- **Estimator** should create and edit estimates
- **Repair Tech** should NOT see financial data at all

#### 2. Analytics Access
- **Marketing** should access full analytics
- **Sales** should access analytics
- **Repair Tech** should get "Access Denied"

#### 3. Delete Operations
- **Admin** can delete records
- **Sales** cannot delete records
- **Estimator** cannot delete records

#### 4. User Management
- **System Admin** can access user management
- **Admin** can access user management
- **All other roles** get "Access Denied"

---

## Troubleshooting

### User Can't Access Feature
1. Check user's assigned roles in User Management
2. Verify role has required permission in `server/rbac-config.ts`
3. Check browser console for 403 errors
4. Clear permission cache: log out and log back in

### Permission Changes Not Taking Effect
1. Permission cache has 5-minute TTL
2. Force refresh: log out and log back in
3. Check server logs for permission check failures

### API Returns 403 Forbidden
1. Verify user is authenticated
2. Check user has required permission
3. Review server logs for specific permission required
4. Ensure permission is assigned to user's role

---

## Security Best Practices

### For Administrators
1. **Limit System Admin role** - only for technical staff
2. **Regular access reviews** - quarterly audit of user roles
3. **Principle of least privilege** - minimal permissions needed
4. **Monitor permission changes** - review audit logs
5. **Secure admin accounts** - strong passwords, 2FA recommended

### For Developers
1. **Always use procedures** - `financialViewProcedure`, not `publicProcedure`
2. **Check permissions in UI** - hide features user can't access
3. **Test with different roles** - verify access control works
4. **Document new permissions** - update this guide when adding features
5. **Cache invalidation** - call `clearUserCache()` after role changes

---

## API Reference

### Frontend Hooks

```typescript
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

const { hasPermission, isAdmin, isLoading } = usePermissions();

if (hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA)) {
  // Show financial data
}

if (isAdmin) {
  // Show admin features
}
```

### Backend Middleware

```typescript
import { financialViewProcedure, adminProcedure } from './rbac-middleware';

// Protect query
getEstimate: financialViewProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    // User has view_financial_data permission
  });

// Protect mutation
deleteUser: adminProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    // User is admin
  });
```

### Backend Helpers

```typescript
import { hasPermission, requirePermission } from './rbac-helpers';

// Check permission
if (await hasPermission(userId, 'view_financial_data')) {
  // Allow access
}

// Require permission (throws error if missing)
await requirePermission(userId, 'approve_payments');
```

---

## Maintenance

### Adding New Permissions
1. Add to `PERMISSIONS` in `server/rbac-config.ts`
2. Add to `permissions` table in database
3. Assign to appropriate roles in `DEFAULT_ROLE_PERMISSIONS`
4. Run `npx tsx server/seed-rbac.ts` to update database
5. Update this documentation

### Adding New Roles
1. Add to `ROLES` in `server/rbac-config.ts`
2. Add to `roles` table in database
3. Define permissions in `DEFAULT_ROLE_PERMISSIONS`
4. Add description in `ROLE_DESCRIPTIONS`
5. Run `npx tsx server/seed-rbac.ts` to update database
6. Update this documentation

### Modifying Role Permissions
1. Update `DEFAULT_ROLE_PERMISSIONS` in `server/rbac-config.ts`
2. Run `npx tsx server/seed-rbac.ts` to update database
3. Existing users keep their roles, permissions update automatically
4. Update this documentation

---

## Support

For questions or issues with the RBAC system:
1. Check this documentation first
2. Review server logs for permission errors
3. Test with different user roles
4. Contact system administrator

---

**Last Updated:** December 2024
**Version:** 1.0
**Author:** Manus AI
