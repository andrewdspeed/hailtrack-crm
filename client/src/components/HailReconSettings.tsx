import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";

interface HailReconSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HailReconSettings({ open, onOpenChange }: HailReconSettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Check if Hail Recon is configured
  const { data: configStatus, refetch } = useQuery({
    queryKey: ["hailRecon.isConfigured"],
    queryFn: () => trpc.hailRecon.isConfigured.query(),
  });

  // Get cache statistics
  const { data: cacheStats } = useQuery({
    queryKey: ["hailRecon.getCacheStats"],
    queryFn: () => trpc.hailRecon.getCacheStats.query(),
    enabled: configStatus?.configured,
  });

  // Set credentials mutation
  const setCredentialsMutation = useMutation({
    mutationFn: (credentials: { apiKey: string; apiUrl: string }) =>
      trpc.hailRecon.setCredentials.mutate(credentials),
    onSuccess: () => {
      toast.success("Hail Recon credentials configured successfully");
      setApiKey("");
      setApiUrl("");
      refetch();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to configure Hail Recon credentials");
      console.error(error);
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: () => trpc.hailRecon.clearCache.mutate(),
    onSuccess: () => {
      toast.success("Cache cleared");
      refetch();
    },
  });

  const handleSaveCredentials = () => {
    if (!apiKey.trim() || !apiUrl.trim()) {
      toast.error("Please enter both API key and URL");
      return;
    }

    setCredentialsMutation.mutate({
      apiKey: apiKey.trim(),
      apiUrl: apiUrl.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hail Recon Settings</DialogTitle>
          <DialogDescription>
            Configure your Hail Recon API credentials to enable hail damage heat map overlay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {configStatus?.configured ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Configured</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium">Not Configured</span>
                  </>
                )}
              </div>
              <Badge variant={configStatus?.configured ? "default" : "outline"}>
                {configStatus?.configured ? "Active" : "Inactive"}
              </Badge>
            </div>
          </Card>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your Hail Recon API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={setCredentialsMutation.isPending}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
                disabled={setCredentialsMutation.isPending}
              >
                {showApiKey ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          {/* API URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">API URL</label>
            <Input
              type="url"
              placeholder="https://api.hailrecon.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              disabled={setCredentialsMutation.isPending}
            />
          </div>

          {/* Cache Statistics */}
          {configStatus?.configured && cacheStats && (
            <Card className="p-3 bg-muted/50 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Cached Regions:</span>
                <span className="font-medium">{cacheStats.cacheSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Duration:</span>
                <span className="font-medium">{cacheStats.cacheDuration} min</span>
              </div>
              {cacheStats.cacheSize > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearCacheMutation.mutate()}
                  disabled={clearCacheMutation.isPending}
                  className="w-full mt-2"
                >
                  {clearCacheMutation.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Clear Cache"
                  )}
                </Button>
              )}
            </Card>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSaveCredentials}
            disabled={setCredentialsMutation.isPending || !apiKey.trim() || !apiUrl.trim()}
            className="w-full"
          >
            {setCredentialsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Save Credentials
              </>
            )}
          </Button>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Note:</strong> Your API credentials are stored securely and only used to fetch hail damage data.
            </p>
            <p>
              Once configured, the heat map will automatically overlay on the map showing hail damage intensity in your area.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
