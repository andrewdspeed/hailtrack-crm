import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { syncOfflineData, setupOnlineListener } from '@/lib/offline-sync';
import { getPendingCount } from '@/lib/offline-db';
import { toast } from 'sonner';

interface OfflineSyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncNow: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  const createLeadMutation = trpc.leads.create.useMutation();
  const createVehicleMutation = trpc.vehicles.create.useMutation();
  const createInsuranceMutation = trpc.insurance.create.useMutation();
  const createFollowUpMutation = trpc.followUps.create.useMutation();
  
  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);
  
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    toast.info('Syncing offline data...');
    
    try {
      const result = await syncOfflineData(
        async (data) => {
          // Create lead
          const leadResult = await createLeadMutation.mutateAsync({
            address: data.address,
            name: data.name || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            city: data.city || undefined,
            state: data.state || undefined,
            latitude: data.latitude || undefined,
            longitude: data.longitude || undefined,
            agentId: data.agentId,
            agentName: data.agentName || undefined,
            notes: data.notes || undefined,
          });
          
          const leadId = Number((leadResult as any).insertId);
          
          // Create vehicle if data exists
          if (data.vehicleYear || data.vehicleMake || data.vehicleModel) {
            await createVehicleMutation.mutateAsync({
              leadId,
              year: data.vehicleYear || undefined,
              make: data.vehicleMake || undefined,
              model: data.vehicleModel || undefined,
              color: data.vehicleColor || undefined,
              vin: data.vehicleVin || undefined,
              glassDamage: data.glassDamage || undefined,
            });
          }
          
          // Create insurance if data exists
          if (data.insuranceProvider || data.policyNumber) {
            await createInsuranceMutation.mutateAsync({
              leadId,
              provider: data.insuranceProvider || undefined,
              providerPhone: data.insurancePhone || undefined,
              policyNumber: data.policyNumber || undefined,
              claimNumber: data.claimNumber || undefined,
            });
          }
          
          return leadResult;
        },
        async (data) => {
          return await createFollowUpMutation.mutateAsync(data);
        },
        (current, total) => {
          console.log(`Syncing ${current}/${total}`);
        }
      );
      
      if (result.synced > 0) {
        toast.success(`Successfully synced ${result.synced} item(s)`);
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to sync ${result.failed} item(s)`);
      }
      
      await refreshPendingCount();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync offline data');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, createLeadMutation, createVehicleMutation, createInsuranceMutation, createFollowUpMutation, refreshPendingCount]);
  
  // Set up online/offline listeners
  useEffect(() => {
    const cleanup = setupOnlineListener(
      () => {
        setIsOnline(true);
        toast.success('Connection restored');
        // Auto-sync when coming back online
        setTimeout(() => syncNow(), 1000);
      },
      () => {
        setIsOnline(false);
        toast.warning('Working offline');
      }
    );
    
    return cleanup;
  }, [syncNow]);
  
  // Refresh pending count on mount
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);
  
  return (
    <OfflineSyncContext.Provider value={{ isOnline, isSyncing, pendingCount, syncNow, refreshPendingCount }}>
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within OfflineSyncProvider');
  }
  return context;
}
