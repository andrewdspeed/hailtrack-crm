import { useOfflineSync } from '@/contexts/OfflineSyncContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloudOff, Cloud, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();
  
  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline status */}
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className={cn(
          "flex items-center gap-1.5",
          isOnline ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>
      
      {/* Pending sync count */}
      {pendingCount > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <CloudOff className="h-3 w-3" />
          {pendingCount} pending
        </Badge>
      )}
      
      {/* Sync button */}
      {isOnline && pendingCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={syncNow}
          disabled={isSyncing}
          className="h-7"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1.5", isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Button>
      )}
      
      {/* Syncing indicator */}
      {isSyncing && (
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <Cloud className="h-3 w-3 animate-pulse" />
          Syncing...
        </Badge>
      )}
    </div>
  );
}
