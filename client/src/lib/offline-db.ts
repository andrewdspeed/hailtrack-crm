import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  pendingLeads: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
  };
  pendingFollowUps: {
    key: string;
    value: {
      id: string;
      leadId: number;
      data: any;
      timestamp: number;
      synced: boolean;
    };
  };
  cachedLeads: {
    key: number;
    value: any;
  };
}

let db: IDBPDatabase<OfflineDB> | null = null;

export async function getOfflineDB() {
  if (db) return db;
  
  db = await openDB<OfflineDB>('hail-crm-offline', 1, {
    upgrade(db) {
      // Store for leads created while offline
      if (!db.objectStoreNames.contains('pendingLeads')) {
        db.createObjectStore('pendingLeads', { keyPath: 'id' });
      }
      
      // Store for follow-ups created while offline
      if (!db.objectStoreNames.contains('pendingFollowUps')) {
        db.createObjectStore('pendingFollowUps', { keyPath: 'id' });
      }
      
      // Cache for leads data (for offline viewing)
      if (!db.objectStoreNames.contains('cachedLeads')) {
        db.createObjectStore('cachedLeads', { keyPath: 'id' });
      }
    },
  });
  
  return db;
}

// Add a lead to the offline queue
export async function queueOfflineLead(leadData: any) {
  const db = await getOfflineDB();
  const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await db.put('pendingLeads', {
    id,
    data: leadData,
    timestamp: Date.now(),
    synced: false,
  });
  
  return id;
}

// Get all pending (unsynced) leads
export async function getPendingLeads() {
  const db = await getOfflineDB();
  const all = await db.getAll('pendingLeads');
  return all.filter(item => !item.synced);
}

// Mark a lead as synced
export async function markLeadSynced(id: string) {
  const db = await getOfflineDB();
  const item = await db.get('pendingLeads', id);
  if (item) {
    item.synced = true;
    await db.put('pendingLeads', item);
  }
}

// Delete a synced lead from queue
export async function deleteSyncedLead(id: string) {
  const db = await getOfflineDB();
  await db.delete('pendingLeads', id);
}

// Cache leads for offline viewing
export async function cacheLeads(leads: any[]) {
  const db = await getOfflineDB();
  const tx = db.transaction('cachedLeads', 'readwrite');
  
  await Promise.all([
    ...leads.map(lead => tx.store.put(lead)),
    tx.done,
  ]);
}

// Get cached leads
export async function getCachedLeads() {
  const db = await getOfflineDB();
  return await db.getAll('cachedLeads');
}

// Get count of pending items
export async function getPendingCount() {
  const db = await getOfflineDB();
  const pendingLeads = await getPendingLeads();
  return pendingLeads.length;
}

// Queue a follow-up while offline
export async function queueOfflineFollowUp(leadId: number, followUpData: any) {
  const db = await getOfflineDB();
  const id = `offline-followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await db.put('pendingFollowUps', {
    id,
    leadId,
    data: followUpData,
    timestamp: Date.now(),
    synced: false,
  });
  
  return id;
}

// Get all pending follow-ups
export async function getPendingFollowUps() {
  const db = await getOfflineDB();
  const all = await db.getAll('pendingFollowUps');
  return all.filter(item => !item.synced);
}

// Mark follow-up as synced
export async function markFollowUpSynced(id: string) {
  const db = await getOfflineDB();
  const item = await db.get('pendingFollowUps', id);
  if (item) {
    item.synced = true;
    await db.put('pendingFollowUps', item);
  }
}

// Delete synced follow-up
export async function deleteSyncedFollowUp(id: string) {
  const db = await getOfflineDB();
  await db.delete('pendingFollowUps', id);
}
