import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  vehicleId: number;
  onConversionSuccess?: () => void;
}

export function ConversionDialog({
  open,
  onOpenChange,
  leadId,
  vehicleId,
  onConversionSuccess,
}: ConversionDialogProps) {
  const [isConverting, setIsConverting] = useState(false);

  // Get conversion preview data
  const { data: preview, isLoading: previewLoading } = trpc.conversion.getConversionPreview.useQuery(
    { leadId },
    { enabled: open }
  );

  // Get validation data
  const { data: validation, isLoading: validationLoading } = trpc.conversion.validateConversion.useQuery(
    { leadId, vehicleId },
    { enabled: open }
  );

  // Conversion mutation
  const convertMutation = trpc.conversion.convertLeadToCustomer.useMutation({
    onSuccess: () => {
      toast.success("Lead successfully converted to customer!");
      onOpenChange(false);
      onConversionSuccess?.();
    },
    onError: (error) => {
      toast.error(`Conversion failed: ${error.message}`);
    },
  });

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      await convertMutation.mutateAsync({ leadId, vehicleId });
    } finally {
      setIsConverting(false);
    }
  };

  const isLoading = previewLoading || validationLoading || isConverting;
  const canConvert = validation?.valid && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Convert Lead to Customer
          </DialogTitle>
          <DialogDescription>
            This lead will be converted to a customer when the vehicle enters the shop.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Validation Errors */}
          {validation && !validation.valid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Cannot convert this lead:</p>
                  <ul className="list-disc list-inside text-sm">
                    {validation.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {preview && (
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-700">Customer Information</div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">Name:</span>
                  <span className="ml-2 font-medium">{preview.customerName || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-600">Phone:</span>
                  <span className="ml-2 font-medium">{preview.customerPhone || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-600">Email:</span>
                  <span className="ml-2 font-medium">{preview.customerEmail || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-600">Address:</span>
                  <span className="ml-2 font-medium">
                    {preview.customerAddress && preview.customerCity
                      ? `${preview.customerAddress}, ${preview.customerCity}, ${preview.customerState}`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Agent:</span>
                  <span className="ml-2 font-medium">{preview.agentName || "—"}</span>
                </div>
              </div>

              {preview.alreadyConverted && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This lead has already been converted to Customer #{preview.existingCustomerId}. 
                    The vehicle will be linked to the existing customer record.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-slate-600">Loading conversion details...</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConverting}>
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!canConvert || convertMutation.isPending}
            className="gap-2"
          >
            {convertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {convertMutation.isPending ? "Converting..." : "Convert to Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
