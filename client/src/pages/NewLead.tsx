import AppLayout from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Save } from "lucide-react";
import PhotoUpload, { PhotoFile } from "@/components/PhotoUpload";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { queueOfflineLead } from "@/lib/offline-db";
import { isOnline } from "@/lib/offline-sync";
import { useOfflineSync } from "@/contexts/OfflineSyncContext";

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function NewLead() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  
  // Get lat/lng from URL if coming from map
  const urlParams = new URLSearchParams(window.location.search);
  const latFromUrl = urlParams.get("lat");
  const lngFromUrl = urlParams.get("lng");

  // Form state
  const [formData, setFormData] = useState({
    // Customer info
    address: "",
    name: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    latitude: latFromUrl || "",
    longitude: lngFromUrl || "",
    
    // Vehicle info
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleColor: "",
    vehicleVin: "",
    glassDamage: "" as "" | "yes" | "no",
    
    // Insurance info
    insuranceProvider: "",
    insurancePhone: "",
    policyNumber: "",
    claimNumber: "",
    
    // Notes
    notes: "",
    followUpResult: "" as "" | "no_answer" | "not_interested" | "interested",
  });

  const uploadPhotoMutation = trpc.photos.upload.useMutation();

  const createLeadMutation = trpc.leads.create.useMutation();
  const createVehicleMutation = trpc.vehicles.create.useMutation();
  const createInsuranceMutation = trpc.insurance.create.useMutation();

  // Get current user for agent assignment
  const { data: user } = trpc.auth.me.useQuery();
  const { refreshPendingCount } = useOfflineSync();

  // Reverse geocode if we have coordinates
  useEffect(() => {
    if (latFromUrl && lngFromUrl && !formData.address) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: parseFloat(latFromUrl), lng: parseFloat(lngFromUrl) } },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            setFormData(prev => ({ ...prev, address: results[0].formatted_address }));
          }
        }
      );
    }
  }, [latFromUrl, lngFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address.trim()) {
      toast.error("Address is required");
      return;
    }

    setIsSubmitting(true);

    // Check if offline
    if (!isOnline()) {
      try {
        const offlineData = {
          ...formData,
          agentId: user?.id,
          agentName: user?.name,
          createdAt: new Date().toISOString(),
        };
        
        await queueOfflineLead(offlineData);
        await refreshPendingCount();
        toast.success("Lead saved offline. Will sync when connection is restored.", {
          duration: 5000,
        });
        setLocation("/leads");
        return;
      } catch (error) {
        console.error("Error saving offline lead:", error);
        toast.error("Failed to save lead offline");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Create lead
      const leadResult = await createLeadMutation.mutateAsync({
        address: formData.address,
        name: formData.name || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        agentId: user?.id,
        agentName: user?.name || undefined,
        notes: formData.notes || undefined,
      });

      const leadId = Number((leadResult as any).insertId);

      // Create vehicle if any vehicle data provided
      const hasVehicleData = formData.vehicleYear || formData.vehicleMake || formData.vehicleModel || 
                             formData.vehicleColor || formData.vehicleVin || formData.glassDamage;
      
      if (hasVehicleData) {
        await createVehicleMutation.mutateAsync({
          leadId,
          year: formData.vehicleYear || undefined,
          make: formData.vehicleMake || undefined,
          model: formData.vehicleModel || undefined,
          color: formData.vehicleColor || undefined,
          vin: formData.vehicleVin || undefined,
          glassDamage: formData.glassDamage || undefined,
        });
      }

      // Create insurance if any insurance data provided
      const hasInsuranceData = formData.insuranceProvider || formData.insurancePhone || 
                               formData.policyNumber || formData.claimNumber;
      
      if (hasInsuranceData) {
        await createInsuranceMutation.mutateAsync({
          leadId,
          provider: formData.insuranceProvider || undefined,
          providerPhone: formData.insurancePhone || undefined,
          policyNumber: formData.policyNumber || undefined,
          claimNumber: formData.claimNumber || undefined,
        });
      }

      // Upload photos if any
      if (photos.length > 0) {
        try {
          for (const photo of photos) {
            // Convert file to base64
            const base64 = await fileToBase64(photo.file);
            
            await uploadPhotoMutation.mutateAsync({
              leadId,
              photoData: base64,
              filename: photo.file.name,
              caption: photo.caption || undefined,
            });
          }
          toast.success(`Lead created with ${photos.length} photo(s)!`);
        } catch (photoError) {
          console.error("Error uploading photos:", photoError);
          toast.warning("Lead created but some photos failed to upload");
        }
      } else {
        toast.success("Lead created successfully!");
      }
      
      setLocation("/leads");
    } catch (error: any) {
      console.error("Error creating lead:", error);
      const errorMessage = error?.message || error?.data?.message || "Failed to create lead";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation("/leads")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">New Lead</h1>
              <p className="text-muted-foreground">Log a new prospect from the field</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Address is required. Fill in what you can collect.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="123 Main St, City, State ZIP"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="followUpResult">Initial Contact Result</Label>
                  <Select value={formData.followUpResult} onValueChange={(value) => handleChange("followUpResult", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_answer">No Answer</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>Optional - fill in what you can observe or collect</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="vehicleYear">Year</Label>
                  <Input
                    id="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={(e) => handleChange("vehicleYear", e.target.value)}
                    placeholder="2020"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleMake">Make</Label>
                  <Input
                    id="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={(e) => handleChange("vehicleMake", e.target.value)}
                    placeholder="Honda"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Model</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => handleChange("vehicleModel", e.target.value)}
                    placeholder="Accord"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleColor">Color</Label>
                  <Input
                    id="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={(e) => handleChange("vehicleColor", e.target.value)}
                    placeholder="Silver"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleVin">VIN</Label>
                  <Input
                    id="vehicleVin"
                    value={formData.vehicleVin}
                    onChange={(e) => handleChange("vehicleVin", e.target.value)}
                    placeholder="1HGBH41JXMN109186"
                    maxLength={17}
                  />
                </div>
                <div>
                  <Label htmlFor="glassDamage">Glass Damage?</Label>
                  <Select value={formData.glassDamage} onValueChange={(value) => handleChange("glassDamage", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
              <CardDescription>Optional - collect if available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                  <Input
                    id="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={(e) => handleChange("insuranceProvider", e.target.value)}
                    placeholder="State Farm"
                  />
                </div>
                <div>
                  <Label htmlFor="insurancePhone">Provider Phone</Label>
                  <Input
                    id="insurancePhone"
                    type="tel"
                    value={formData.insurancePhone}
                    onChange={(e) => handleChange("insurancePhone", e.target.value)}
                    placeholder="(800) 555-1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    value={formData.policyNumber}
                    onChange={(e) => handleChange("policyNumber", e.target.value)}
                    placeholder="POL-123456"
                  />
                </div>
                <div>
                  <Label htmlFor="claimNumber">Claim Number</Label>
                  <Input
                    id="claimNumber"
                    value={formData.claimNumber}
                    onChange={(e) => handleChange("claimNumber", e.target.value)}
                    placeholder="CLM-789012"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Damage Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Damage Photos</CardTitle>
              <CardDescription>Take photos of vehicle damage for documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUpload onPhotosChange={setPhotos} maxPhotos={10} />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Any additional observations or details</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Visible hail damage on hood and roof. Customer seemed interested but wants to think about it..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Lead"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/leads")}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
