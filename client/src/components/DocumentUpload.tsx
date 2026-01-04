import { useState, useRef } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DocumentUploadProps {
  leadId: number;
  onUploadComplete?: () => void;
}

interface PendingDocument {
  file: File;
  category: string;
  description: string;
}

export default function DocumentUpload({ leadId, onUploadComplete }: DocumentUploadProps) {
  const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);
  const [category, setCategory] = useState<string>("other");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded");
      onUploadComplete?.();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newDocs: PendingDocument[] = files.map(file => ({
      file,
      category,
      description,
    }));

    setPendingDocs([...pendingDocs, ...newDocs]);
    setDescription("");
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeDocument = (index: number) => {
    setPendingDocs(pendingDocs.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (pendingDocs.length === 0) {
      toast.error("No documents to upload");
      return;
    }

    for (const doc of pendingDocs) {
      try {
        // Convert file to base64
        const base64 = await fileToBase64(doc.file);
        
        await uploadMutation.mutateAsync({
          leadId,
          fileData: base64,
          filename: doc.file.name,
          fileType: doc.file.type || doc.file.name.split(".").pop() || "unknown",
          category: doc.category as any,
          description: doc.description || undefined,
        });
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    setPendingDocs([]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      {/* Upload Form */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Document Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="estimate">Estimate</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="authorization">Authorization</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description (Optional)</Label>
            <Input
              placeholder="e.g., Insurance claim form"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supported: PDF, Word, Excel, Images, Text, CSV
          </p>
        </div>
      </Card>

      {/* Pending Documents */}
      {pendingDocs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Ready to Upload ({pendingDocs.length})</h4>
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload All"}
            </Button>
          </div>

          {pendingDocs.map((doc, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <File className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(doc.file.size)} • {doc.category}
                    </p>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDocument(index)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
