/**
 * Loaner Vehicles Management Page
 * Manage loaner vehicle inventory, assignments, and maintenance
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
import { Car, Plus, Edit, Trash2, Calendar, Wrench, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export default function LoanerVehicles() {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Fetch loaner vehicles
  const { data: vehicles, isLoading, refetch } = trpc.loaners.list.useQuery();

  // Mutations
  const createVehicle = trpc.loaners.create.useMutation({
    onSuccess: () => {
      toast.success("Vehicle added successfully");
      refetch();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add vehicle: ${error.message}`);
    },
  });

  const updateVehicle = trpc.loaners.update.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      refetch();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update vehicle: ${error.message}`);
    },
  });

  const deleteVehicle = trpc.loaners.delete.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete vehicle: ${error.message}`);
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

  if (!hasPermission(PERMISSIONS.MANAGE_LOANER_VEHICLES)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md text-center">
          <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to manage loaner vehicles.
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
      available: { icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-300", label: "Available" },
      assigned: { icon: AlertCircle, color: "bg-blue-100 text-blue-800 border-blue-300", label: "Assigned" },
      maintenance: { icon: Wrench, color: "bg-orange-100 text-orange-800 border-orange-300", label: "Maintenance" },
      out_of_service: { icon: XCircle, color: "bg-red-100 text-red-800 border-red-300", label: "Out of Service" },
    };

    const badge = badges[status] || badges.available;
    const Icon = badge.icon;

    return (
      <Badge variant="outline" className={badge.color}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </Badge>
    );
  };

  // Group vehicles by status
  const availableVehicles = vehicles?.filter(v => v.status === "available") || [];
  const assignedVehicles = vehicles?.filter(v => v.status === "assigned") || [];
  const maintenanceVehicles = vehicles?.filter(v => v.status === "maintenance") || [];
  const outOfServiceVehicles = vehicles?.filter(v => v.status === "out_of_service") || [];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Car className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Loaner Vehicles</h1>
          </div>
          <p className="text-muted-foreground">
            Manage loaner vehicle inventory and assignments
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-3xl font-bold text-green-600">{availableVehicles.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-3xl font-bold text-blue-600">{assignedVehicles.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-3xl font-bold text-orange-600">{maintenanceVehicles.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Service</p>
                <p className="text-3xl font-bold text-red-600">{outOfServiceVehicles.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <div className="grid gap-4">
        {vehicles && vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      {getStatusBadge(vehicle.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Color</p>
                        <p className="font-medium">{vehicle.color || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">License Plate</p>
                        <p className="font-medium">{vehicle.licensePlate || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">VIN</p>
                        <p className="font-medium text-xs">{vehicle.vin || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mileage</p>
                        <p className="font-medium">{vehicle.currentMileage?.toLocaleString() || "N/A"} mi</p>
                      </div>
                    </div>

                    {vehicle.activeAssignment && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-blue-900">
                          Currently assigned to Lead #{vehicle.activeAssignment.leadId}
                        </p>
                        <p className="text-xs text-blue-700">
                          Assigned: {new Date(vehicle.activeAssignment.assignedDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {vehicle.nextMaintenanceDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Next maintenance: {new Date(vehicle.nextMaintenanceDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {vehicle.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{vehicle.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this vehicle?")) {
                          deleteVehicle.mutate({ id: vehicle.id });
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
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No loaner vehicles in inventory</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </Card>
        )}
      </div>

      {/* Add Vehicle Dialog */}
      <AddVehicleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(data) => createVehicle.mutate(data)}
        isLoading={createVehicle.isPending}
      />

      {/* Edit Vehicle Dialog */}
      <EditVehicleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        vehicle={selectedVehicle}
        onSubmit={(data) => updateVehicle.mutate({ id: selectedVehicle.id, data })}
        isLoading={updateVehicle.isPending}
      />
    </div>
  );
}

// Add Vehicle Dialog Component
interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function AddVehicleDialog({ open, onOpenChange, onSubmit, isLoading }: AddVehicleDialogProps) {
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    color: "",
    vin: "",
    licensePlate: "",
    currentMileage: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!formData.make || !formData.model || !formData.year) {
      toast.error("Please fill in all required fields");
      return;
    }

    onSubmit({
      ...formData,
      currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Loaner Vehicle</DialogTitle>
          <DialogDescription>
            Add a new vehicle to the loaner fleet inventory
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <Label>Make *</Label>
            <Input
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="Toyota"
            />
          </div>
          <div>
            <Label>Model *</Label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Camry"
            />
          </div>
          <div>
            <Label>Year *</Label>
            <Input
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              placeholder="2023"
              maxLength={4}
            />
          </div>
          <div>
            <Label>Color</Label>
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Silver"
            />
          </div>
          <div>
            <Label>VIN</Label>
            <Input
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
            />
          </div>
          <div>
            <Label>License Plate</Label>
            <Input
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
              placeholder="ABC-1234"
            />
          </div>
          <div className="col-span-2">
            <Label>Current Mileage</Label>
            <Input
              type="number"
              value={formData.currentMileage}
              onChange={(e) => setFormData({ ...formData, currentMileage: e.target.value })}
              placeholder="25000"
            />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this vehicle..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Vehicle Dialog Component
interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function EditVehicleDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }: EditVehicleDialogProps) {
  const [formData, setFormData] = useState({
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    year: vehicle?.year || "",
    color: vehicle?.color || "",
    vin: vehicle?.vin || "",
    licensePlate: vehicle?.licensePlate || "",
    status: vehicle?.status || "available",
    currentMileage: vehicle?.currentMileage?.toString() || "",
    notes: vehicle?.notes || "",
  });

  // Update form when vehicle changes
  useState(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year || "",
        color: vehicle.color || "",
        vin: vehicle.vin || "",
        licensePlate: vehicle.licensePlate || "",
        status: vehicle.status || "available",
        currentMileage: vehicle.currentMileage?.toString() || "",
        notes: vehicle.notes || "",
      });
    }
  });

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : undefined,
    });
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update vehicle information and status
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <Label>Make</Label>
            <Input
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            />
          </div>
          <div>
            <Label>Model</Label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
          </div>
          <div>
            <Label>Year</Label>
            <Input
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              maxLength={4}
            />
          </div>
          <div>
            <Label>Color</Label>
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>
          <div>
            <Label>VIN</Label>
            <Input
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              maxLength={17}
            />
          </div>
          <div>
            <Label>License Plate</Label>
            <Input
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Current Mileage</Label>
            <Input
              type="number"
              value={formData.currentMileage}
              onChange={(e) => setFormData({ ...formData, currentMileage: e.target.value })}
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
