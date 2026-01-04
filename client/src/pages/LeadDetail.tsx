import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import PhotoGallery from "@/components/PhotoGallery";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";
import EstimateForm from "@/components/EstimateForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Copy, Phone, Mail, MapPin, Car, FileText, Clock, Check, MessageSquare, Camera, DollarSign, Download, Users, Wrench } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { InspectionForm } from "@/components/InspectionForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConversionDialog } from "@/components/ConversionDialog";

export default function LeadDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const leadId = parseInt(id!);
  
  const { data: lead, refetch: refetchLead } = trpc.leads.getById.useQuery({ id: leadId });
  const { data: vehicles } = trpc.vehicles.getByLeadId.useQuery({ leadId });
  const { data: insurance } = trpc.insurance.getByLeadId.useQuery({ leadId });
  const { data: followUps } = trpc.followUps.getByLeadId.useQuery({ leadId });
  const { data: templates } = trpc.textTemplates.list.useQuery();
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: photos, refetch: refetchPhotos } = trpc.photos.getByLeadId.useQuery({ leadId });
  const { data: documents, refetch: refetchDocuments } = trpc.documents.getByLeadId.useQuery({ leadId });
  const { data: estimates, refetch: refetchEstimates } = trpc.estimates.getByLeadId.useQuery({ leadId });
  const { data: inspections, refetch: refetchInspections } = trpc.inspections.getByLeadId.useQuery({ leadId });
  const { data: technicianAssignments, refetch: refetchAssignments } = trpc.technicians.getAssignmentsByLeadId.useQuery({ leadId });
  const { data: availableTechnicians } = trpc.technicians.getActive.useQuery();
  const { data: loanerAssignments, refetch: refetchLoaners } = trpc.loaners.getAssignmentsByLeadId.useQuery({ leadId });
  const { data: availableLoaners } = trpc.loaners.getAvailable.useQuery();
  const [showEstimateForm, setShowEstimateForm] = useState(false);
  const [showTechnicianDialog, setShowTechnicianDialog] = useState(false);
  const [showLoanerDialog, setShowLoanerDialog] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { hasPermission } = usePermissions();

  const updateStatusMutation = trpc.leads.updateStatus.useMutation();
  const updateLeadMutation = trpc.leads.update.useMutation();
  const createFollowUpMutation = trpc.followUps.create.useMutation();
  const updateTechnicianStatus = trpc.technicians.updateJobStatus.useMutation();
  const returnLoaner = trpc.loaners.returnVehicle.useMutation();

  if (!lead) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const currentTemplate = templates?.find(t => t.stage === lead.status);
  const cooldownStatus = getCooldownStatus(lead.lastFollowUpAt);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: leadId, status: newStatus as any });
      await refetchLead();
      toast.success("Status updated");
      
      // Show conversion dialog when moving to in_shop
      if (newStatus === "in_shop" && vehicles && vehicles.length > 0) {
        setShowConversionDialog(true);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSubStatusChange = async (subStatus: string) => {
    try {
      await updateLeadMutation.mutateAsync({ 
        id: leadId, 
        data: { subStatus } 
      });
      await refetchLead();
      toast.success("Sub-status updated");
    } catch (error) {
      toast.error("Failed to update sub-status");
    }
  };

  const handleLogFollowUp = async (result: "no_answer" | "not_interested" | "interested" | "scheduled") => {
    if (!currentUser) {
      toast.error("User not authenticated");
      return;
    }

    try {
      await createFollowUpMutation.mutateAsync({
        leadId,
        agentId: currentUser.id,
        agentName: currentUser.name || "Unknown",
        stage: lead.status,
        notes: followUpNotes || undefined,
      });

      // Update lead's last follow-up time and result
      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: {
          lastFollowUpAt: new Date().toISOString() as any,
        },
      });

      // If successful, move to scheduled
      if (result === "scheduled") {
        await handleStatusChange("scheduled");
      }

      setFollowUpNotes("");
      await refetchLead();
      toast.success("Follow-up logged");
    } catch (error) {
      toast.error("Failed to log follow-up");
    }
  };

  const handleCopyTemplate = () => {
    if (!currentTemplate) return;

    let text = currentTemplate.template;
    
    // Replace placeholders
    text = text.replace(/\[Name\]/g, lead.name || "[Name]");
    text = text.replace(/\[Agent\]/g, currentUser?.name || "[Agent]");
    text = text.replace(/\[Address\]/g, lead.address);
    text = text.replace(/\[Phone\]/g, lead.phone || "[Phone]");
    
    if (vehicles && vehicles.length > 0) {
      const vehicle = vehicles[0];
      text = text.replace(/\[Vehicle\]/g, `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim() || "[Vehicle]");
    }
    
    if (insurance) {
      text = text.replace(/\[Insurance Provider\]/g, insurance.provider || "[Insurance Provider]");
    }

    navigator.clipboard.writeText(text);
    toast.success("Template copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={() => setLocation("/leads")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{lead.name || "Unnamed Lead"}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                {lead.address}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {cooldownStatus && (
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${getCooldownColor(cooldownStatus)}`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">
                    {cooldownStatus === "red" && "Too soon"}
                    {cooldownStatus === "yellow" && "Follow-up soon"}
                    {cooldownStatus === "green" && "Ready to follow up"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Status Management */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Main Status</label>
                <Select value={lead.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_shop">In Shop</SelectItem>
                    <SelectItem value="awaiting_pickup">Awaiting Pickup</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {lead.status === "in_shop" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Shop Sub-Status</label>
                  <Select value={lead.subStatus || ""} onValueChange={handleSubStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waiting_approval">Waiting for Approval</SelectItem>
                      <SelectItem value="waiting_parts">Waiting for Parts</SelectItem>
                      <SelectItem value="in_repair">In Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Text Template */}
        {currentTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Text Template
              </CardTitle>
              <CardDescription>Copy and paste into your SMS app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                {currentTemplate.template
                  .replace(/\[Name\]/g, lead.name || "[Name]")
                  .replace(/\[Agent\]/g, currentUser?.name || "[Agent]")
                  .replace(/\[Address\]/g, lead.address)
                  .replace(/\[Phone\]/g, lead.phone || "[Phone]")
                  .replace(/\[Vehicle\]/g, vehicles && vehicles.length > 0 
                    ? `${vehicles[0].year} ${vehicles[0].make} ${vehicles[0].model}`.trim() 
                    : "[Vehicle]")
                  .replace(/\[Insurance Provider\]/g, insurance?.provider || "[Insurance Provider]")}
              </div>
              <Button onClick={handleCopyTemplate} className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Follow-up Section */}
        <Card>
          <CardHeader>
            <CardTitle>Log Follow-up</CardTitle>
            <CardDescription>
              {cooldownStatus === "red" && "⏱️ Wait 48 hours before next follow-up"}
              {cooldownStatus === "yellow" && "⚠️ Follow-up window opening soon"}
              {cooldownStatus === "green" && "✅ Ready for follow-up"}
              {!cooldownStatus && "Log your first follow-up attempt"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Notes from this follow-up attempt..."
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              rows={3}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleLogFollowUp("no_answer")}
                disabled={cooldownStatus === "red"}
              >
                No Answer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleLogFollowUp("not_interested")}
                disabled={cooldownStatus === "red"}
              >
                Not Interested
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleLogFollowUp("interested")}
                disabled={cooldownStatus === "red"}
              >
                Interested
              </Button>
              <Button 
                onClick={() => handleLogFollowUp("scheduled")}
                disabled={cooldownStatus === "red"}
              >
                <Check className="h-4 w-4 mr-2" />
                Scheduled
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                  {lead.phone}
                </a>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                  {lead.email}
                </a>
              </div>
            )}
            {lead.agentName && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="text-sm">Agent:</span>
                <span className="font-medium">{lead.agentName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Damage Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Damage Photos
            </CardTitle>
            <CardDescription>
              {photos?.length || 0} photo(s) uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoGallery
              leadId={leadId}
              photos={photos || []}
              onPhotoDeleted={refetchPhotos}
              allowDelete={true}
            />
          </CardContent>
        </Card>

        {/* Documents & Inspection Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents & Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Documents</TabsTrigger>
                <TabsTrigger value="inspection">
                  Inspection
                  {inspections && inspections.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{inspections.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
                <DocumentUpload leadId={leadId} onUploadComplete={refetchDocuments} />
                <DocumentList
                  leadId={leadId}
                  documents={documents || []}
                  onDocumentDeleted={refetchDocuments}
                  allowDelete={true}
                />
              </TabsContent>
              
              <TabsContent value="inspection" className="mt-6">
                {inspections && inspections.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {inspections.length} inspection(s) completed
                      </p>
                      <Button size="sm" onClick={() => setActiveTab("new-inspection")}>
                        New Inspection
                      </Button>
                    </div>
                    {inspections.map((inspection: any) => (
                      <Card key={inspection.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Inspection #{inspection.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(inspection.createdAt).toLocaleDateString()}
                            </p>
                            <Badge variant="outline" className="mt-1">{inspection.status}</Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No inspections yet</p>
                    <Button onClick={() => setActiveTab("new-inspection")}>
                      Start Inspection
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="new-inspection" className="mt-6">
                <InspectionForm
                  leadId={leadId}
                  onSave={() => {
                    refetchInspections();
                    setActiveTab("inspection");
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Estimates & Invoices */}
        {hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Estimates & Invoices
                </CardTitle>
                <CardDescription>
                  Create estimates and track invoices
                </CardDescription>
              </div>
              <Button onClick={() => setShowEstimateForm(!showEstimateForm)}>
                {showEstimateForm ? "Cancel" : "Create Estimate"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showEstimateForm ? (
              <EstimateForm
                leadId={leadId}
                onSuccess={() => {
                  setShowEstimateForm(false);
                  refetchEstimates();
                }}
              />
            ) : (
              <div className="space-y-4">
                {estimates && estimates.length > 0 ? (
                  estimates.map((est: any) => (
                    <Card key={est.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{est.estimateNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(est.total / 100)}
                          </p>
                          <Badge variant="outline" className="mt-1">{est.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            {new Date(est.createdAt).toLocaleDateString()}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const result = await trpc.estimates.generatePDF.mutate({ id: est.id });
                                const blob = new Blob([Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))], { type: 'application/pdf' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = result.filename;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast.success('PDF downloaded');
                              } catch (error: any) {
                                toast.error(`Failed to generate PDF: ${error.message}`);
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No estimates created yet
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Technician Assignments */}
        {hasPermission(PERMISSIONS.ASSIGN_TECHNICIANS) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Technician Assignments
                </CardTitle>
                <CardDescription>
                  Assign technicians to this job
                </CardDescription>
              </div>
              <Button onClick={() => setShowTechnicianDialog(true)}>
                Assign Technician
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {technicianAssignments && technicianAssignments.length > 0 ? (
              <div className="space-y-3">
                {technicianAssignments.map((assignment: any) => (
                  <Card key={assignment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{assignment.technician?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{assignment.technician?.specialty || ""}</p>
                        <Badge variant="outline" className="mt-1">{assignment.status}</Badge>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}</p>
                        {assignment.estimatedHours && (
                          <p>Est. Hours: {assignment.estimatedHours}</p>
                        )}
                      </div>
                    </div>
                    {assignment.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{assignment.notes}</p>
                    )}
                    {assignment.status !== "completed" && assignment.status !== "cancelled" && (
                      <div className="flex gap-2 mt-3">
                        {assignment.status === "assigned" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              updateTechnicianStatus.mutate(
                                {
                                  assignmentId: assignment.id,
                                  status: "in_progress",
                                  startDate: new Date(),
                                },
                                {
                                  onSuccess: () => {
                                    refetchAssignments();
                                    toast.success("Work started");
                                  },
                                  onError: (error) => {
                                    toast.error(`Failed: ${error.message}`);
                                  },
                                }
                              );
                            }}
                          >
                            Start Work
                          </Button>
                        )}
                        {assignment.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              updateTechnicianStatus.mutate(
                                {
                                  assignmentId: assignment.id,
                                  status: "completed",
                                  completedDate: new Date(),
                                },
                                {
                                  onSuccess: () => {
                                    refetchAssignments();
                                    toast.success("Job completed");
                                  },
                                  onError: (error) => {
                                    toast.error(`Failed: ${error.message}`);
                                  },
                                }
                              );
                            }}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No technicians assigned yet
              </p>
            )}
          </CardContent>
        </Card>
        )}

        {/* Loaner Vehicle Assignment */}
        {(lead.status === "in_shop" || lead.status === "awaiting_pickup") && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Loaner Vehicle
                </CardTitle>
                <CardDescription>
                  Assign a loaner vehicle to the customer
                </CardDescription>
              </div>
              {loanerAssignments && loanerAssignments.some((a: any) => !a.returnedDate) ? null : (
                <Button onClick={() => setShowLoanerDialog(true)}>
                  Assign Loaner
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loanerAssignments && loanerAssignments.length > 0 ? (
              <div className="space-y-3">
                {loanerAssignments.map((assignment: any) => (
                  <Card key={assignment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {assignment.vehicle?.year} {assignment.vehicle?.make} {assignment.vehicle?.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.vehicle?.licensePlate || "No plate"}
                        </p>
                        <Badge variant={assignment.returnedDate ? "outline" : "secondary"} className="mt-1">
                          {assignment.returnedDate ? "Returned" : "Active"}
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Out: {new Date(assignment.assignedDate).toLocaleDateString()}</p>
                        {assignment.returnedDate && (
                          <p>In: {new Date(assignment.returnedDate).toLocaleDateString()}</p>
                        )}
                        {assignment.mileageOut && (
                          <p>Mileage: {assignment.mileageOut.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    {!assignment.returnedDate && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            const mileageIn = prompt("Enter return mileage:");
                            if (!mileageIn) return;
                            
                            const fuelLevelIn = prompt("Enter fuel level (full/3/4/1/2/1/4/empty):") || "full";
                            const condition = prompt("Vehicle condition notes (optional):") || "";
                            
                            returnLoaner.mutate(
                              {
                                assignmentId: assignment.id,
                                mileageIn: parseInt(mileageIn),
                                fuelLevelIn,
                                conditionNotes: condition,
                              },
                              {
                                onSuccess: () => {
                                  refetchLoaners();
                                  toast.success("Loaner vehicle returned");
                                },
                                onError: (error) => {
                                  toast.error(`Failed: ${error.message}`);
                                },
                              }
                            );
                          }}
                        >
                          Return Vehicle
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No loaner vehicle assigned
              </p>
            )}
          </CardContent>
        </Card>
        )}

        {/* Vehicle Information */}
        {vehicles && vehicles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.map((vehicle, idx) => (
                <div key={vehicle.id} className={idx > 0 ? "mt-4 pt-4 border-t" : ""}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {vehicle.year && (
                      <div>
                        <span className="text-muted-foreground">Year:</span>
                        <p className="font-medium">{vehicle.year}</p>
                      </div>
                    )}
                    {vehicle.make && (
                      <div>
                        <span className="text-muted-foreground">Make:</span>
                        <p className="font-medium">{vehicle.make}</p>
                      </div>
                    )}
                    {vehicle.model && (
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <p className="font-medium">{vehicle.model}</p>
                      </div>
                    )}
                    {vehicle.color && (
                      <div>
                        <span className="text-muted-foreground">Color:</span>
                        <p className="font-medium">{vehicle.color}</p>
                      </div>
                    )}
                  </div>
                  {vehicle.vin && (
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">VIN:</span>
                      <p className="font-mono text-sm">{vehicle.vin}</p>
                    </div>
                  )}
                  {vehicle.glassDamage && (
                    <Badge variant="secondary" className="mt-3">
                      Glass Damage: {vehicle.glassDamage === "yes" ? "Yes" : "No"}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Insurance Information */}
        {insurance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {insurance.provider && (
                  <div>
                    <span className="text-muted-foreground">Provider:</span>
                    <p className="font-medium">{insurance.provider}</p>
                  </div>
                )}
                {insurance.policyNumber && (
                  <div>
                    <span className="text-muted-foreground">Policy #:</span>
                    <p className="font-medium">{insurance.policyNumber}</p>
                  </div>
                )}
                {insurance.claimNumber && (
                  <div>
                    <span className="text-muted-foreground">Claim #:</span>
                    <p className="font-medium">{insurance.claimNumber}</p>
                  </div>
                )}
                {insurance.providerPhone && (
                  <div>
                    <span className="text-muted-foreground">Provider Phone:</span>
                    <p className="font-medium">{insurance.providerPhone}</p>
                  </div>
                )}
              </div>
              
              {(insurance.adjusterName || insurance.adjusterPhone || insurance.adjusterEmail) && (
                <>
                  <Separator className="my-4" />
                  <h4 className="font-semibold mb-3">Adjuster Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {insurance.adjusterName && (
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{insurance.adjusterName}</p>
                      </div>
                    )}
                    {insurance.adjusterPhone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium">{insurance.adjusterPhone}</p>
                      </div>
                    )}
                    {insurance.adjusterEmail && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{insurance.adjusterEmail}</p>
                      </div>
                    )}
                    {insurance.adjusterOfficeHours && (
                      <div>
                        <span className="text-muted-foreground">Office Hours:</span>
                        <p className="font-medium">{insurance.adjusterOfficeHours}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Follow-up History */}
        {followUps && followUps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Follow-up History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {followUps.map((followUp) => (
                  <div key={followUp.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="p-2 bg-muted rounded-lg h-fit">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{followUp.agentName}</span>
                        <Badge variant="outline">{formatStatus(followUp.stage)}</Badge>
                      </div>
                      {followUp.notes && (
                        <p className="text-sm text-muted-foreground mb-2">{followUp.notes}</p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(followUp.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {lead.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Technician Assignment Dialog */}
      <TechnicianAssignmentDialog
        open={showTechnicianDialog}
        onOpenChange={setShowTechnicianDialog}
        leadId={leadId}
        availableTechnicians={availableTechnicians || []}
        onSuccess={() => {
          refetchAssignments();
          toast.success("Technician assigned successfully");
        }}
      />

      {/* Loaner Vehicle Assignment Dialog */}
      <LoanerAssignmentDialog
        open={showLoanerDialog}
        onOpenChange={setShowLoanerDialog}
        leadId={leadId}
        customerName={lead.name}
        availableLoaners={availableLoaners || []}
        onSuccess={() => {
          refetchLoaners();
          toast.success("Loaner vehicle assigned successfully");
        }}
      />

      {/* Lead to Customer Conversion Dialog */}
      {vehicles && vehicles.length > 0 && (
        <ConversionDialog
          open={showConversionDialog}
          onOpenChange={setShowConversionDialog}
          leadId={leadId}
          vehicleId={vehicles[0].id}
          onConversionSuccess={() => {
            refetchLead();
            toast.success("Lead converted to customer!");
          }}
        />
      )}
    </div>
  );
}

function getCooldownStatus(lastFollowUpAt: Date | null): "red" | "yellow" | "green" | null {
  if (!lastFollowUpAt) return null;

  const hoursSince = (Date.now() - new Date(lastFollowUpAt).getTime()) / (1000 * 60 * 60);

  if (hoursSince < 48) return "red";
  if (hoursSince < 72) return "yellow";
  return "green";
}

function getCooldownColor(status: "red" | "yellow" | "green"): string {
  const colors = {
    red: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
    green: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
  };
  return colors[status];
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Technician Assignment Dialog Component
interface TechnicianAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  availableTechnicians: any[];
  onSuccess: () => void;
}

function TechnicianAssignmentDialog({ open, onOpenChange, leadId, availableTechnicians, onSuccess }: TechnicianAssignmentDialogProps) {
  const [selectedTechId, setSelectedTechId] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [notes, setNotes] = useState("");
  const { data: currentUser } = trpc.auth.me.useQuery();

  const assignTechnician = trpc.technicians.assignJob.useMutation({
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      setSelectedTechId("");
      setEstimatedHours("");
      setNotes("");
    },
    onError: (error) => {
      toast.error(`Failed to assign technician: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!selectedTechId) {
      toast.error("Please select a technician");
      return;
    }

    assignTechnician.mutate({
      leadId,
      technicianId: parseInt(selectedTechId),
      estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
      notes,
      assignedBy: currentUser?.name || "Unknown",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Select a technician to assign to this job
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Technician *</Label>
            <Select value={selectedTechId} onValueChange={setSelectedTechId}>
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {availableTechnicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{tech.name}</span>
                      {tech.specialty && <span className="text-xs text-muted-foreground ml-2">({tech.specialty})</span>}
                      {tech.totalWorkload > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {tech.totalWorkload} {tech.totalWorkload === 1 ? 'job' : 'jobs'}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estimated Hours</Label>
            <Input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="e.g., 8"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assignTechnician.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={assignTechnician.isPending}>
            {assignTechnician.isPending ? "Assigning..." : "Assign Technician"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Loaner Vehicle Assignment Dialog Component
interface LoanerAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  customerName: string;
  availableLoaners: any[];
  onSuccess: () => void;
}

function LoanerAssignmentDialog({ open, onOpenChange, leadId, customerName, availableLoaners, onSuccess }: LoanerAssignmentDialogProps) {
  const [selectedLoanerId, setSelectedLoanerId] = useState("");
  const [mileageOut, setMileageOut] = useState("");
  const [fuelLevelOut, setFuelLevelOut] = useState("");
  const [notes, setNotes] = useState("");
  const { data: currentUser } = trpc.auth.me.useQuery();

  const assignLoaner = trpc.loaners.assignVehicle.useMutation({
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      setSelectedLoanerId("");
      setMileageOut("");
      setFuelLevelOut("");
      setNotes("");
    },
    onError: (error) => {
      toast.error(`Failed to assign loaner: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!selectedLoanerId) {
      toast.error("Please select a loaner vehicle");
      return;
    }

    assignLoaner.mutate({
      vehicleId: parseInt(selectedLoanerId),
      leadId,
      customerName,
      mileageOut: mileageOut ? parseInt(mileageOut) : undefined,
      fuelLevelOut: fuelLevelOut || undefined,
      notes,
      assignedBy: currentUser?.name || "Unknown",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Loaner Vehicle</DialogTitle>
          <DialogDescription>
            Assign a loaner vehicle to {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Loaner Vehicle *</Label>
            <Select value={selectedLoanerId} onValueChange={setSelectedLoanerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {availableLoaners.map((loaner) => (
                  <SelectItem key={loaner.id} value={loaner.id.toString()}>
                    {loaner.year} {loaner.make} {loaner.model} - {loaner.licensePlate || "No plate"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mileage Out</Label>
              <Input
                type="number"
                value={mileageOut}
                onChange={(e) => setMileageOut(e.target.value)}
                placeholder="e.g., 45000"
              />
            </div>
            <div>
              <Label>Fuel Level Out</Label>
              <Select value={fuelLevelOut} onValueChange={setFuelLevelOut}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="1/2">1/2</SelectItem>
                  <SelectItem value="1/4">1/4</SelectItem>
                  <SelectItem value="empty">Empty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or vehicle condition notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assignLoaner.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={assignLoaner.isPending}>
            {assignLoaner.isPending ? "Assigning..." : "Assign Loaner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
