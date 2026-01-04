/**
 * Technicians Management Page
 * Manage technician profiles and view workload
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Edit, Trash2, Briefcase, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export default function Technicians() {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);

  // Fetch technicians
  const { data: technicians, isLoading, refetch } = trpc.technicians.list.useQuery();

  // Mutations
  const createTechnician = trpc.technicians.create.useMutation({
    onSuccess: () => {
      toast.success("Technician added successfully");
      refetch();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add technician: ${error.message}`);
    },
  });

  const updateTechnician = trpc.technicians.update.useMutation({
    onSuccess: () => {
      toast.success("Technician updated successfully");
      refetch();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update technician: ${error.message}`);
    },
  });

  const deleteTechnician = trpc.technicians.delete.useMutation({
    onSuccess: () => {
      toast.success("Technician deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete technician: ${error.message}`);
    },
  });

  // Permission check
  if (permissionsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission(PERMISSIONS.ASSIGN_TECHNICIANS)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to manage technicians.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your administrator if you need access.
          </p>
        </Card>
      </div>
    );
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; color: string; label: string }> = {
      active: { icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-300", label: "Active" },
      inactive: { icon: XCircle, color: "bg-gray-100 text-gray-800 border-gray-300", label: "Inactive" },
      on_leave: { icon: AlertCircle, color: "bg-orange-100 text-orange-800 border-orange-300", label: "On Leave" },
    };

    const badge = badges[status] || badges.active;
    const Icon = badge.icon;

    return (
      <Badge variant="outline" className={badge.color}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </Badge>
    );
  };

  // Group technicians by status
  const activeTechnicians = technicians?.filter(t => t.status === "active") || [];
  const inactiveTechnicians = technicians?.filter(t => t.status === "inactive") || [];
  const onLeaveTechnicians = technicians?.filter(t => t.status === "on_leave") || [];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Technicians</h1>
          </div>
          <p className="text-muted-foreground">
            Manage technician profiles and assignments
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Technician
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-green-600">{activeTechnicians.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Leave</p>
                <p className="text-3xl font-bold text-orange-600">{onLeaveTechnicians.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-3xl font-bold text-gray-600">{inactiveTechnicians.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technician List */}
      <div className="grid gap-4">
        {technicians && technicians.length > 0 ? (
          technicians.map((technician) => (
            <Card key={technician.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{technician.name}</h3>
                      {getStatusBadge(technician.status)}
                      {technician.activeJobCount > 0 && (
                        <Badge variant="secondary">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {technician.activeJobCount} active {technician.activeJobCount === 1 ? 'job' : 'jobs'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm mb-3">
                      {technician.specialty && (
                        <div>
                          <p className="text-muted-foreground">Specialty</p>
                          <p className="font-medium">{technician.specialty}</p>
                        </div>
                      )}
                      {technician.email && (
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium text-xs">{technician.email}</p>
                        </div>
                      )}
                      {technician.phone && (
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{technician.phone}</p>
                        </div>
                      )}
                      {technician.hourlyRate && (
                        <div>
                          <p className="text-muted-foreground">Hourly Rate</p>
                          <p className="font-medium">${(technician.hourlyRate / 100).toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    {technician.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{technician.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTechnician(technician);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this technician?")) {
                          deleteTechnician.mutate({ id: technician.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No technicians added yet</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Technician
            </Button>
          </Card>
        )}
      </div>

      {/* Add Technician Dialog */}
      <AddTechnicianDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(data) => createTechnician.mutate(data)}
        isLoading={createTechnician.isPending}
      />

      {/* Edit Technician Dialog */}
      <EditTechnicianDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        technician={selectedTechnician}
        onSubmit={(data) => updateTechnician.mutate({ id: selectedTechnician.id, data })}
        isLoading={updateTechnician.isPending}
      />
    </div>
  );
}

// Add Technician Dialog Component
interface AddTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function AddTechnicianDialog({ open, onOpenChange, onSubmit, isLoading }: AddTechnicianDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    hourlyRate: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Please enter technician name");
      return;
    }

    onSubmit({
      ...formData,
      hourlyRate: formData.hourlyRate ? Math.round(parseFloat(formData.hourlyRate) * 100) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Technician</DialogTitle>
          <DialogDescription>
            Add a new technician to the team
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2">
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label>Specialty</Label>
            <Input
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="PDR, Glass, Paint, etc."
            />
          </div>
          <div>
            <Label>Hourly Rate ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              placeholder="50.00"
            />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this technician..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Technician"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Technician Dialog Component
interface EditTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function EditTechnicianDialog({ open, onOpenChange, technician, onSubmit, isLoading }: EditTechnicianDialogProps) {
  const [formData, setFormData] = useState({
    name: technician?.name || "",
    email: technician?.email || "",
    phone: technician?.phone || "",
    specialty: technician?.specialty || "",
    status: technician?.status || "active",
    hourlyRate: technician?.hourlyRate ? (technician.hourlyRate / 100).toString() : "",
    notes: technician?.notes || "",
  });

  // Update form when technician changes
  useState(() => {
    if (technician) {
      setFormData({
        name: technician.name || "",
        email: technician.email || "",
        phone: technician.phone || "",
        specialty: technician.specialty || "",
        status: technician.status || "active",
        hourlyRate: technician.hourlyRate ? (technician.hourlyRate / 100).toString() : "",
        notes: technician.notes || "",
      });
    }
  });

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      hourlyRate: formData.hourlyRate ? Math.round(parseFloat(formData.hourlyRate) * 100) : undefined,
    });
  };

  if (!technician) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Technician</DialogTitle>
          <DialogDescription>
            Update technician information and status
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Specialty</Label>
            <Input
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Hourly Rate ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
