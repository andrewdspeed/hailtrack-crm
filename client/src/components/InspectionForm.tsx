import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, Check, X, Minus, Save, Send } from "lucide-react";
import { toast } from "sonner";

// Checklist items from the inspection form
const PRE_SCAN_CHECKLIST = [
  "Headlights & High Beams",
  "Turn Signals & Hazards",
  "Taillights & 3\" Brake Light",
  "Reverse Lights & Brake Lights",
  "Back-up Camera",
  "Dash / Warning Lights",
  "Radio & Horn",
  "Windows & Sunroof",
  "Wipers & Nozzles",
  "Windshield & Glass",
  "Interior Condition (Wear & Tear)",
  "Headliner, Visors, Pillars, Dome Lights",
  "Hood Open & Insulator",
  "Rock Chips & Door Dings",
  "Tires & Wheels & Fender Liners",
  "Door Handles & Locks (Inside/Outside)",
  "Trunk Open & Insulator",
  "Antenna Cap / Rod",
  "Paint / Body Issues",
];

const POST_SCAN_CHECKLIST = [
  "Missed Dents",
  "Manufactured Holes",
  "Ghost Circles & Swirls & Wax Pen",
  "Belt & Sash & ¼ Glass Moldings",
  "Roof Moldings / Rack",
];

interface ChecklistItem {
  name: string;
  result?: "pass" | "fail" | "na";
  notes?: string;
  photoUrl?: string;
}

interface InspectionFormProps {
  leadId: number;
  onSave?: () => void;
  initialData?: any;
}

export function InspectionForm({ leadId, onSave, initialData }: InspectionFormProps) {
  const [keyTagNumber, setKeyTagNumber] = useState(initialData?.keyTagNumber || "");
  
  // Pre-scan section
  const [preScanName1, setPreScanName1] = useState(initialData?.preScanName1 || "");
  const [preScanDate1, setPreScanDate1] = useState(initialData?.preScanDate1 || "");
  const [preScanName2, setPreScanName2] = useState(initialData?.preScanName2 || "");
  const [preScanDate2, setPreScanDate2] = useState(initialData?.preScanDate2 || "");
  const [fillTank, setFillTank] = useState<"yes" | "no" | "">(initialData?.fillTank || "");
  const [odometerIn, setOdometerIn] = useState(initialData?.odometerIn || "");
  const [fuelLevelIn, setFuelLevelIn] = useState(initialData?.fuelLevelIn || "");
  
  // Incentive
  const [incentiveAmount, setIncentiveAmount] = useState(initialData?.incentiveAmount || "");
  const [incentiveName, setIncentiveName] = useState(initialData?.incentiveName || "");
  const [incentivePaidDate, setIncentivePaidDate] = useState(initialData?.incentivePaidDate || "");
  const [incentiveCheckNumber, setIncentiveCheckNumber] = useState(initialData?.incentiveCheckNumber || "");
  
  // Referral
  const [referralAmount, setReferralAmount] = useState(initialData?.referralAmount || "");
  const [referralName, setReferralName] = useState(initialData?.referralName || "");
  const [referralPaidDate, setReferralPaidDate] = useState(initialData?.referralPaidDate || "");
  const [referralCheckNumber, setReferralCheckNumber] = useState(initialData?.referralCheckNumber || "");
  
  // Checklist items
  const [preScanItems, setPreScanItems] = useState<ChecklistItem[]>(
    PRE_SCAN_CHECKLIST.map(name => ({ name, result: undefined, notes: "", photoUrl: "" }))
  );
  const [postScanItems, setPostScanItems] = useState<ChecklistItem[]>(
    POST_SCAN_CHECKLIST.map(name => ({ name, result: undefined, notes: "", photoUrl: "" }))
  );
  
  // Post-scan section
  const [detailBy, setDetailBy] = useState(initialData?.detailBy || "");
  const [detailDate, setDetailDate] = useState(initialData?.detailDate || "");
  const [jairoQC, setJairoQC] = useState(initialData?.jairoQC || "");
  const [jairoQCDate, setJairoQCDate] = useState(initialData?.jairoQCDate || "");
  const [alecKK, setAlecKK] = useState(initialData?.alecKK || "");
  const [alecKKDate, setAlecKKDate] = useState(initialData?.alecKKDate || "");
  
  // Delivery
  const [specificRequestsChecked, setSpecificRequestsChecked] = useState(initialData?.specificRequestsChecked || "");
  const [fueledBy, setFueledBy] = useState(initialData?.fueledBy || "");
  const [deliveryScheduledBy, setDeliveryScheduledBy] = useState(initialData?.deliveryScheduledBy || "");
  const [deliveryDateTime, setDeliveryDateTime] = useState(initialData?.deliveryDateTime || "");
  
  // Notes
  const [inspectionNotes, setInspectionNotes] = useState(initialData?.inspectionNotes || "");
  const [incentiveNotes, setIncentiveNotes] = useState(initialData?.incentiveNotes || "");
  const [quoteRequestNotes, setQuoteRequestNotes] = useState(initialData?.quoteRequestNotes || "");
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes || "");

  const updatePreScanItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const updated = [...preScanItems];
    updated[index] = { ...updated[index], [field]: value };
    setPreScanItems(updated);
  };

  const updatePostScanItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const updated = [...postScanItems];
    updated[index] = { ...updated[index], [field]: value };
    setPostScanItems(updated);
  };

  const handleSaveDraft = () => {
    toast.success("Inspection saved as draft");
    onSave?.();
  };

  const handleSubmit = () => {
    toast.success("Inspection submitted successfully");
    onSave?.();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inspection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Key Tag #</Label>
              <Input
                value={keyTagNumber}
                onChange={(e) => setKeyTagNumber(e.target.value)}
                placeholder="Key tag number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-Scan Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Scan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name 1</Label>
              <Input
                value={preScanName1}
                onChange={(e) => setPreScanName1(e.target.value)}
              />
            </div>
            <div>
              <Label>Date 1</Label>
              <Input
                type="date"
                value={preScanDate1}
                onChange={(e) => setPreScanDate1(e.target.value)}
              />
            </div>
            <div>
              <Label>Name 2</Label>
              <Input
                value={preScanName2}
                onChange={(e) => setPreScanName2(e.target.value)}
              />
            </div>
            <div>
              <Label>Date 2</Label>
              <Input
                type="date"
                value={preScanDate2}
                onChange={(e) => setPreScanDate2(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Fill Tank?</Label>
              <RadioGroup value={fillTank} onValueChange={(v) => setFillTank(v as "yes" | "no")}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="fill-yes" />
                    <Label htmlFor="fill-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="fill-no" />
                    <Label htmlFor="fill-no">No</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Odometer (In)</Label>
              <Input
                value={odometerIn}
                onChange={(e) => setOdometerIn(e.target.value)}
                placeholder="Odometer reading"
              />
            </div>
            <div>
              <Label>Fuel Level (In)</Label>
              <Input
                value={fuelLevelIn}
                onChange={(e) => setFuelLevelIn(e.target.value)}
                placeholder="Fuel level"
              />
            </div>
          </div>

          {/* Incentive */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Incentive</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  value={incentiveAmount}
                  onChange={(e) => setIncentiveAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={incentiveName}
                  onChange={(e) => setIncentiveName(e.target.value)}
                />
              </div>
              <div>
                <Label>Paid Date</Label>
                <Input
                  type="date"
                  value={incentivePaidDate}
                  onChange={(e) => setIncentivePaidDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Check #</Label>
                <Input
                  value={incentiveCheckNumber}
                  onChange={(e) => setIncentiveCheckNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Referral */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Referral</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  value={referralAmount}
                  onChange={(e) => setReferralAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={referralName}
                  onChange={(e) => setReferralName(e.target.value)}
                />
              </div>
              <div>
                <Label>Paid Date</Label>
                <Input
                  type="date"
                  value={referralPaidDate}
                  onChange={(e) => setReferralPaidDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Check #</Label>
                <Input
                  value={referralCheckNumber}
                  onChange={(e) => setReferralCheckNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="Pre-scan notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pre-Scan Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Scan Inspection Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preScanItems.map((item, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label className="text-base">{item.name}</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={item.result === "pass" ? "default" : "outline"}
                      onClick={() => updatePreScanItem(index, "result", "pass")}
                      className="w-20"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Pass
                    </Button>
                    <Button
                      size="sm"
                      variant={item.result === "fail" ? "destructive" : "outline"}
                      onClick={() => updatePreScanItem(index, "result", "fail")}
                      className="w-20"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Fail
                    </Button>
                    <Button
                      size="sm"
                      variant={item.result === "na" ? "secondary" : "outline"}
                      onClick={() => updatePreScanItem(index, "result", "na")}
                      className="w-20"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      N/A
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {/* TODO: Photo upload */}}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {item.result === "fail" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Notes about failure..."
                      value={item.notes}
                      onChange={(e) => updatePreScanItem(index, "notes", e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Post-Scan Section */}
      <Card>
        <CardHeader>
          <CardTitle>Post-Scan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Detail By</Label>
              <Input
                value={detailBy}
                onChange={(e) => setDetailBy(e.target.value)}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={detailDate}
                onChange={(e) => setDetailDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Jairo QC</Label>
              <Input
                value={jairoQC}
                onChange={(e) => setJairoQC(e.target.value)}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={jairoQCDate}
                onChange={(e) => setJairoQCDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Alec/KK</Label>
              <Input
                value={alecKK}
                onChange={(e) => setAlecKK(e.target.value)}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={alecKKDate}
                onChange={(e) => setAlecKKDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Post-Scan Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Post-Scan Only Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {postScanItems.map((item, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label className="text-base">{item.name}</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={item.result === "pass" ? "default" : "outline"}
                      onClick={() => updatePostScanItem(index, "result", "pass")}
                      className="w-20"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Pass
                    </Button>
                    <Button
                      size="sm"
                      variant={item.result === "fail" ? "destructive" : "outline"}
                      onClick={() => updatePostScanItem(index, "result", "fail")}
                      className="w-20"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Fail
                    </Button>
                    <Button
                      size="sm"
                      variant={item.result === "na" ? "secondary" : "outline"}
                      onClick={() => updatePostScanItem(index, "result", "na")}
                      className="w-20"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      N/A
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {/* TODO: Photo upload */}}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {item.result === "fail" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Notes about failure..."
                      value={item.notes}
                      onChange={(e) => updatePostScanItem(index, "notes", e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <Label>Incentive Requests</Label>
              <Textarea
                value={incentiveNotes}
                onChange={(e) => setIncentiveNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Quote Requests</Label>
              <Textarea
                value={quoteRequestNotes}
                onChange={(e) => setQuoteRequestNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Section */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Specific Requests Checked / Completed By</Label>
              <Input
                value={specificRequestsChecked}
                onChange={(e) => setSpecificRequestsChecked(e.target.value)}
              />
            </div>
            <div>
              <Label>Fueled By</Label>
              <Input
                value={fueledBy}
                onChange={(e) => setFueledBy(e.target.value)}
              />
            </div>
            <div>
              <Label>Delivery Scheduled By</Label>
              <Input
                value={deliveryScheduledBy}
                onChange={(e) => setDeliveryScheduledBy(e.target.value)}
              />
            </div>
            <div>
              <Label>Delivery Date/Time</Label>
              <Input
                type="datetime-local"
                value={deliveryDateTime}
                onChange={(e) => setDeliveryDateTime(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleSaveDraft}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button onClick={handleSubmit}>
          <Send className="h-4 w-4 mr-2" />
          Submit Inspection
        </Button>
      </div>
    </div>
  );
}
