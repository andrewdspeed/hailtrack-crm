import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileUp, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExtractedLead {
  pageNumber: number;
  data: any;
  success: boolean;
  error: string | null;
}

interface BulkImportLeadsProps {
  onComplete: (leads: any[]) => void;
}

function getConfidenceColor(confidence?: number): string {
  if (!confidence) return "text-muted-foreground";
  if (confidence >= 80) return "text-green-600";
  if (confidence >= 50) return "text-yellow-600";
  return "text-red-600";
}

function getConfidenceBadge(confidence?: number): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (!confidence) return { label: "Unknown", variant: "secondary" };
  if (confidence >= 80) return { label: "High", variant: "default" };
  if (confidence >= 50) return { label: "Medium", variant: "secondary" };
  return { label: "Low", variant: "destructive" };
}

export default function BulkImportLeads({ onComplete }: BulkImportLeadsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedLeads, setExtractedLeads] = useState<ExtractedLead[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractMultiPageMutation = trpc.ocr.extractMultiPagePdf.useMutation();

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }

    setSelectedFile(file);
    setExtractedLeads([]);
    setProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        try {
          toast.info("Processing PDF pages...");
          
          const results = await extractMultiPageMutation.mutateAsync({
            pdf: base64,
          });

          setExtractedLeads(results);
          setProgress(100);
          
          const successCount = results.filter(r => r.success).length;
          const failCount = results.filter(r => !r.success).length;
          
          if (successCount > 0) {
            toast.success(`Extracted ${successCount} lead(s) successfully!`);
          }
          if (failCount > 0) {
            toast.warning(`Failed to extract ${failCount} lead(s)`);
          }
        } catch (error: any) {
          toast.error(`Processing failed: ${error.message}`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast.error(`Failed to process file: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setExtractedLeads([]);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApproveAll = () => {
    const successfulLeads = extractedLeads
      .filter(lead => lead.success && lead.data)
      .map(lead => lead.data);
    
    if (successfulLeads.length === 0) {
      toast.error("No valid leads to approve");
      return;
    }

    onComplete(successfulLeads);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Bulk Import from Multi-Page PDF
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a PDF with multiple lead sheets. Each page will be processed separately.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedFile ? (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Drop your multi-page PDF here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse files
              </p>
              <Button type="button" variant="outline">
                <FileUp className="h-4 w-4 mr-2" />
                Choose PDF File
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📄</div>
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing pages...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Action Buttons */}
            {extractedLeads.length === 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Process All Pages
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Extracted Leads Summary */}
            {extractedLeads.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Extracted {extractedLeads.length} Lead(s)
                  </h3>
                  <Button onClick={handleApproveAll} size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve All ({extractedLeads.filter(l => l.success).length})
                  </Button>
                </div>

                {/* Lead Cards */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {extractedLeads.map((lead, index) => (
                    <Card key={index} className={!lead.success ? "border-red-200" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Page {lead.pageNumber}</Badge>
                            {lead.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          {lead.data?.confidence && (
                            <Badge {...getConfidenceBadge(
                              Object.values(lead.data.confidence).reduce((a: number, b: number) => a + b, 0) / 
                              Object.keys(lead.data.confidence).length
                            )}>
                              {getConfidenceBadge(
                                Object.values(lead.data.confidence).reduce((a: number, b: number) => a + b, 0) / 
                                Object.keys(lead.data.confidence).length
                              ).label} Confidence
                            </Badge>
                          )}
                        </div>

                        {lead.success && lead.data ? (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {lead.data.name && (
                              <div>
                                <span className="text-muted-foreground">Name: </span>
                                <span className={getConfidenceColor(lead.data.confidence?.name)}>
                                  {lead.data.name}
                                </span>
                              </div>
                            )}
                            {lead.data.phone && (
                              <div>
                                <span className="text-muted-foreground">Phone: </span>
                                <span className={getConfidenceColor(lead.data.confidence?.phone)}>
                                  {lead.data.phone}
                                </span>
                              </div>
                            )}
                            {lead.data.address && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Address: </span>
                                <span className={getConfidenceColor(lead.data.confidence?.address)}>
                                  {lead.data.address}
                                </span>
                              </div>
                            )}
                            {lead.data.make && lead.data.model && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Vehicle: </span>
                                <span className={getConfidenceColor(
                                  Math.min(lead.data.confidence?.make || 0, lead.data.confidence?.model || 0)
                                )}>
                                  {lead.data.year} {lead.data.make} {lead.data.model}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-red-600">
                            Error: {lead.error || "Failed to extract data"}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
