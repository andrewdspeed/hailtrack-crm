/**
 * User Management Page
 * Admin-only page for managing user roles and permissions
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, Users, Search, Edit, CheckCircle2 } from 'lucide-react';

export default function UserManagement() {
  const { hasPermission, isAdmin, isLoading: permissionsLoading } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  // Fetch all users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.rbac.listUsers.useQuery(
    undefined,
    { enabled: isAdmin }
  );

  // Fetch all roles
  const { data: roles } = trpc.rbac.getRoles.useQuery();

  // Fetch user details when selected
  const { data: userDetails, refetch: refetchUserDetails } = trpc.rbac.getUserDetails.useQuery(
    { userId: selectedUser! },
    { enabled: selectedUser !== null }
  );

  // Mutations
  const bulkAssignRoles = trpc.rbac.bulkAssignRoles.useMutation({
    onSuccess: () => {
      toast.success('Roles updated successfully');
      refetchUsers();
      refetchUserDetails();
      setIsRoleDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update roles: ${error.message}`);
    },
  });

  // Loading state
  if (permissionsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user management...</p>
        </div>
      </div>
    );
  }

  // Permission check
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access user management.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your system administrator if you need access.
          </p>
        </Card>
      </div>
    );
  }

  // Filter users by search query
  const filteredUsers = users?.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.roles.some(role => role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle role assignment
  const handleEditRoles = (userId: number) => {
    setSelectedUser(userId);
    setIsRoleDialogOpen(true);
  };

  const handleSaveRoles = (selectedRoleIds: number[]) => {
    if (selectedUser === null) return;

    bulkAssignRoles.mutate({
      userId: selectedUser,
      roleIds: selectedRoleIds,
    });
  };

  // Role color mapping
  const getRoleColor = (roleName: string): string => {
    const colors: Record<string, string> = {
      system_admin: 'bg-red-100 text-red-800 border-red-300',
      admin: 'bg-purple-100 text-purple-800 border-purple-300',
      sales: 'bg-blue-100 text-blue-800 border-blue-300',
      appraiser: 'bg-green-100 text-green-800 border-green-300',
      estimator: 'bg-orange-100 text-orange-800 border-orange-300',
      marketing: 'bg-pink-100 text-pink-800 border-pink-300',
      repair_tech: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage user roles and permissions for your team
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* User List */}
      <div className="grid gap-4">
        {filteredUsers?.map((user) => (
          <Card key={user.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{user.name || 'Unnamed User'}</h3>
                  {user.roles.includes('admin') || user.roles.includes('system_admin') ? (
                    <Badge variant="default" className="bg-purple-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  ) : null}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className={getRoleColor(role)}
                      >
                        {role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500">
                      No roles assigned
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{user.permissionCount} permissions</span>
                  <span>•</span>
                  <span>
                    Last login: {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditRoles(user.id)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Roles
              </Button>
            </div>
          </Card>
        ))}

        {filteredUsers?.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found matching your search.</p>
          </Card>
        )}
      </div>

      {/* Role Assignment Dialog */}
      <RoleAssignmentDialog
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        user={userDetails?.user}
        currentRoles={userDetails?.roles || []}
        availableRoles={roles || []}
        onSave={handleSaveRoles}
        isLoading={bulkAssignRoles.isPending}
      />
    </div>
  );
}

// Role Assignment Dialog Component
interface RoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  currentRoles: any[];
  availableRoles: any[];
  onSave: (roleIds: number[]) => void;
  isLoading: boolean;
}

function RoleAssignmentDialog({
  open,
  onOpenChange,
  user,
  currentRoles,
  availableRoles,
  onSave,
  isLoading,
}: RoleAssignmentDialogProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // Initialize selected roles when dialog opens
  useState(() => {
    if (open && currentRoles) {
      setSelectedRoleIds(currentRoles.map(r => r.roleId));
    }
  });

  const handleToggleRole = (roleId: number) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = () => {
    onSave(selectedRoleIds);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Roles for {user.name}</DialogTitle>
          <DialogDescription>
            Select the roles you want to assign to this user. Permissions are automatically granted based on roles.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {availableRoles.map((role) => {
            const isSelected = selectedRoleIds.includes(role.id);
            const isCurrentlyAssigned = currentRoles.some(r => r.roleId === role.id);

            return (
              <div
                key={role.id}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => handleToggleRole(role.id)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleRole(role.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {role.name.replace('_', ' ').toUpperCase()}
                    </span>
                    {isCurrentlyAssigned && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Currently Assigned
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {role.description || 'No description available'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
