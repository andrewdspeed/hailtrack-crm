import { useState } from "react";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  category: "labor" | "parts" | "materials" | "other";
}

interface EstimateFormProps {
  leadId: number;
  onSuccess?: () => void;
}

export default function EstimateForm({ leadId, onSuccess }: EstimateFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, category: "other" }
  ]);
  const [taxRate, setTaxRate] = useState(8.5); // Default 8.5%
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(30);

  const createEstimateMutation = trpc.estimates.create.useMutation({
    onSuccess: () => {
      toast.success("Estimate created successfully");
      onSuccess?.();
      // Reset form
      setLineItems([{ id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, category: "other" }]);
      setNotes("");
      setDiscountAmount(0);
    },
    onError: (error) => {
      toast.error(`Failed to create estimate: ${error.message}`);
    },
  });

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, category: "other" }
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateLineTotal = (item: LineItem) => {
    return item.quantity * item.unitPrice;
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - discountAmount;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSubmit = async (status: "draft" | "sent") => {
    // Validation
    const hasEmptyDescriptions = lineItems.some(item => !item.description.trim());
    if (hasEmptyDescriptions) {
      toast.error("Please fill in all line item descriptions");
      return;
    }

    const hasZeroPrices = lineItems.some(item => item.unitPrice <= 0);
    if (hasZeroPrices) {
      toast.error("All line items must have a price greater than zero");
      return;
    }

    // Calculate valid until date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Convert to cents for storage
    const subtotal = Math.round(calculateSubtotal() * 100);
    const taxAmount = Math.round(calculateTax() * 100);
    const discountAmountCents = Math.round(discountAmount * 100);
    const total = Math.round(calculateTotal() * 100);

    await createEstimateMutation.mutateAsync({
      leadId,
      status,
      subtotal,
      taxRate: Math.round(taxRate * 100), // Store as basis points
      taxAmount,
      discountAmount: discountAmountCents,
      total,
      notes: notes || undefined,
      validUntil,
      lineItems: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100), // Convert to cents
        total: Math.round(calculateLineTotal(item) * 100),
        category: item.category,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-4 border rounded-lg">
              <div className="col-span-12 md:col-span-5">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="e.g., Hail damage repair - driver side"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                />
              </div>

              <div className="col-span-4 md:col-span-2">
                <Label className="text-xs">Category</Label>
                <Select
                  value={item.category}
                  onValueChange={(v) => updateLineItem(item.id, "category", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="parts">Parts</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3 md:col-span-1">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="col-span-4 md:col-span-2">
                <Label className="text-xs">Unit Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="col-span-4 md:col-span-1">
                <Label className="text-xs">Total</Label>
                <div className="h-10 flex items-center font-semibold">
                  {formatCurrency(calculateLineTotal(item))}
                </div>
              </div>

              <div className="col-span-1 flex items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button onClick={addLineItem} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>
        </CardContent>
      </Card>

      {/* Calculations */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label>Discount Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({taxRate}%):</span>
              <span className="font-medium">{formatCurrency(calculateTax())}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span className="font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Valid For (Days)</Label>
            <Input
              type="number"
              min="1"
              value={validDays}
              onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Estimate will be valid until {new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Additional terms, conditions, or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={createEstimateMutation.isPending}
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit("sent")}
          disabled={createEstimateMutation.isPending}
        >
          {createEstimateMutation.isPending ? "Creating..." : "Create & Send Estimate"}
        </Button>
      </div>
    </div>
  );
}
