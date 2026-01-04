import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import AppLayout from "@/components/AppLayout";
import LeadSheetUpload from "@/components/LeadSheetUpload";
import BulkImportLeads from "@/components/BulkImportLeads";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ImportLeads() {
  const [, setLocation] = useLocation();
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    year: "",
    make: "",
    model: "",
    color: "",
    vin: "",
    glassDamage: false,
    insuranceProvider: "",
    insurancePhone: "",
    claimNumber: "",
    policyNumber: "",
    adjusterName: "",
    adjusterPhone: "",
    adjusterEmail: "",
    notes: "",
  });

  const createLeadMutation = trpc.leads.create.useMutation();

  const handleDataExtracted = (data: any) => {
    setExtractedData(data);
    setFormData({
      name: data.name || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      city: data.city || "",
      state: data.state || "",
      year: data.year || "",
      make: data.make || "",
      model: data.model || "",
      color: data.color || "",
      vin: data.vin || "",
      glassDamage: data.glassDamage || false,
      insuranceProvider: data.insuranceProvider || "",
      insurancePhone: data.insurancePhone || "",
      claimNumber: data.claimNumber || "",
      policyNumber: data.policyNumber || "",
      adjusterName: data.adjusterName || "",
      adjusterPhone: data.adjusterPhone || "",
      adjusterEmail: data.adjusterEmail || "",
      notes: data.notes || "",
    });
    toast.success("Data extracted! Please review and edit if needed.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address) {
      toast.error("Address is required");
      return;
    }

    try {
      const result = await createLeadMutation.mutateAsync({
        name: formData.name || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address,
        city: formData.city || null,
        state: formData.state || null,
        status: "lead",
        subStatus: null,
        vehicle: {
          year: formData.year || null,
          make: formData.make || null,
          model: formData.model || null,
          color: formData.color || null,
          vin: formData.vin || null,
          glassDamage: formData.glassDamage,
        },
        insurance: formData.insuranceProvider ? {
          provider: formData.insuranceProvider,
          phone: formData.insurancePhone || null,
          claimNumber: formData.claimNumber || null,
          policyNumber: formData.policyNumber || null,
          adjusterName: formData.adjusterName || null,
          adjusterPhone: formData.adjusterPhone || null,
          adjusterEmail: formData.adjusterEmail || null,
        } : null,
        notes: formData.notes || null,
      });

      toast.success("Lead created successfully!");
      setLocation(`/leads/${result.id}`);
    } catch (error: any) {
      toast.error(`Failed to create lead: ${error.message}`);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30">
        <div className="bg-background border-b border-border p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/leads")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
            <h1 className="text-2xl font-bold">Import Paper Lead Sheets</h1>
            <p className="text-muted-foreground">
              Upload photos or scans of your paper forms and we'll automatically extract the information.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          <BulkImportLeads onComplete={(leads) => {
            toast.success(`Ready to create ${leads.length} lead(s)`);
            // Handle bulk lead creation
            leads.forEach(data => handleDataExtracted(data));
          }} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or import single sheet
              </span>
            </div>
          </div>
          
          <LeadSheetUpload onDataExtracted={handleDataExtracted} />

          {extractedData && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Edit Extracted Data</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Please review the extracted information and make any necessary corrections before saving.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="make">Make</Label>
                        <Input
                          id="make"
                          value={formData.make}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="vin">VIN</Label>
                        <Input
                          id="vin"
                          value={formData.vin}
                          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="glassDamage"
                            checked={formData.glassDamage}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, glassDamage: checked as boolean })
                            }
                          />
                          <Label htmlFor="glassDamage" className="cursor-pointer">
                            Glass Damage
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Insurance Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Insurance Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="insuranceProvider">Provider</Label>
                        <Input
                          id="insuranceProvider"
                          value={formData.insuranceProvider}
                          onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="insurancePhone">Phone</Label>
                        <Input
                          id="insurancePhone"
                          type="tel"
                          value={formData.insurancePhone}
                          onChange={(e) => setFormData({ ...formData, insurancePhone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="claimNumber">Claim #</Label>
                        <Input
                          id="claimNumber"
                          value={formData.claimNumber}
                          onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="policyNumber">Policy #</Label>
                        <Input
                          id="policyNumber"
                          value={formData.policyNumber}
                          onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Adjuster Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Adjuster Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="adjusterName">Name</Label>
                        <Input
                          id="adjusterName"
                          value={formData.adjusterName}
                          onChange={(e) => setFormData({ ...formData, adjusterName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adjusterPhone">Phone</Label>
                        <Input
                          id="adjusterPhone"
                          type="tel"
                          value={formData.adjusterPhone}
                          onChange={(e) => setFormData({ ...formData, adjusterPhone: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="adjusterEmail">Email</Label>
                        <Input
                          id="adjusterEmail"
                          type="email"
                          value={formData.adjusterEmail}
                          onChange={(e) => setFormData({ ...formData, adjusterEmail: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createLeadMutation.isPending}
                      className="flex-1"
                    >
                      {createLeadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Lead...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Lead
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setExtractedData(null);
                        setFormData({
                          name: "",
                          phone: "",
                          email: "",
                          address: "",
                          city: "",
                          state: "",
                          year: "",
                          make: "",
                          model: "",
                          color: "",
                          vin: "",
                          glassDamage: false,
                          insuranceProvider: "",
                          insurancePhone: "",
                          claimNumber: "",
                          policyNumber: "",
                          adjusterName: "",
                          adjusterPhone: "",
                          adjusterEmail: "",
                          notes: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
