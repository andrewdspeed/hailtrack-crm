import { 
  getPendingLeads, 
  getPendingFollowUps,
  markLeadSynced,
  markFollowUpSynced,
  deleteSyncedLead,
  deleteSyncedFollowUp,
} from './offline-db';

// Sync all pending data when online
export async function syncOfflineData(
  createLeadFn: (data: any) => Promise<any>,
  createFollowUpFn: (data: any) => Promise<any>,
  onProgress?: (current: number, total: number) => void
) {
  const pendingLeads = await getPendingLeads();
  const pendingFollowUps = await getPendingFollowUps();
  
  const totalItems = pendingLeads.length + pendingFollowUps.length;
  let syncedCount = 0;
  const errors: Array<{ type: string; id: string; error: any }> = [];
  
  // Sync leads first
  for (const item of pendingLeads) {
    try {
      await createLeadFn(item.data);
      await deleteSyncedLead(item.id);
      syncedCount++;
      onProgress?.(syncedCount, totalItems);
    } catch (error) {
      console.error(`Failed to sync lead ${item.id}:`, error);
      errors.push({ type: 'lead', id: item.id, error });
    }
  }
  
  // Then sync follow-ups
  for (const item of pendingFollowUps) {
    try {
      await createFollowUpFn(item.data);
      await deleteSyncedFollowUp(item.id);
      syncedCount++;
      onProgress?.(syncedCount, totalItems);
    } catch (error) {
      console.error(`Failed to sync follow-up ${item.id}:`, error);
      errors.push({ type: 'followup', id: item.id, error });
    }
  }
  
  return {
    total: totalItems,
    synced: syncedCount,
    failed: errors.length,
    errors,
  };
}

// Check if we're online
export function isOnline() {
  return navigator.onLine;
}

// Listen for online/offline events
export function setupOnlineListener(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
