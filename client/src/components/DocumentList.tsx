import { FileText, Download, Trash2, File, FileSpreadsheet, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Document {
  id: number;
  leadId: number;
  documentUrl: string;
  filename: string;
  fileType: string;
  fileSize: number | null;
  category: string | null;
  description: string | null;
  uploadedBy: string | null;
  uploadedAt: Date;
}

interface DocumentListProps {
  leadId: number;
  documents: Document[];
  onDocumentDeleted?: () => void;
  allowDelete?: boolean;
}

export default function DocumentList({ leadId, documents, onDocumentDeleted, allowDelete = true }: DocumentListProps) {
  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      onDocumentDeleted?.();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleDelete = (id: number, filename: string) => {
    if (confirm(`Delete "${filename}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) 
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (type.includes("image") || type.includes("jpg") || type.includes("png")) 
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (type.includes("word") || type.includes("doc")) 
      return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "insurance": return "bg-blue-100 text-blue-800 border-blue-300";
      case "estimate": return "bg-purple-100 text-purple-800 border-purple-300";
      case "invoice": return "bg-green-100 text-green-800 border-green-300";
      case "receipt": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "authorization": return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No documents uploaded yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {getFileIcon(doc.fileType)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{doc.filename}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {doc.category && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(doc.category)}`}
                      >
                        {doc.category}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground mt-2">{doc.description}</p>
                  )}
                  {doc.uploadedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded by {doc.uploadedBy}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(doc.documentUrl, "_blank")}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {allowDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id, doc.filename)}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
