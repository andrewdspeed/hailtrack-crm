import { useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { offlineCache } from "@/lib/offlineCache";
import { toast } from "sonner";

interface RouteDownloadButtonProps {
  routeId: number;
  routeData: any;
  leads: any[];
}

export function RouteDownloadButton({ routeId, routeData, leads }: RouteDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const success = await offlineCache.downloadRouteForOffline(routeId, routeData, leads);
      
      if (success) {
        setIsDownloaded(true);
        toast.success('Route downloaded for offline use');
      } else {
        toast.error('Failed to download route');
      }
    } catch (error) {
      console.error('[RouteDownload] Error:', error);
      toast.error('Failed to download route');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isDownloaded) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Check className="h-4 w-4 text-green-600" />
        Downloaded
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isDownloading ? 'Downloading...' : 'Download for Offline'}
    </Button>
  );
}
