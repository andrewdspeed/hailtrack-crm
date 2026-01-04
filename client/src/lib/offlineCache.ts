/**
 * Offline Cache Manager
 * Manages service worker registration and offline data caching
 */

export interface CachedRoute {
  id: number;
  name: string;
  stops: any[];
  totalDistance: number;
  estimatedTime: number;
  cachedAt: Date;
}

export interface CacheStats {
  totalSize: number;
  routeCount: number;
  leadCount: number;
  lastSync: Date | null;
}

class OfflineCacheManager {
  private serviceWorker: ServiceWorker | null = null;
  private syncQueue: Array<{ type: string; data: any }> = [];

  /**
   * Register service worker
   */
  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[OfflineCache] Service workers not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[OfflineCache] Service worker registered:', registration.scope);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      this.serviceWorker = registration.active;

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[OfflineCache] Service worker updated');
              window.location.reload();
            }
          });
        }
      });

      // Listen for online/offline events
      window.addEventListener('online', () => this.syncWhenOnline());
      window.addEventListener('offline', () => this.handleOffline());

      return true;
    } catch (error) {
      console.error('[OfflineCache] Service worker registration failed:', error);
      return false;
    }
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        console.log('[OfflineCache] Service worker unregistered');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[OfflineCache] Service worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Cache route data for offline access
   */
  async cacheRoute(route: any): Promise<boolean> {
    if (!this.serviceWorker) {
      console.warn('[OfflineCache] Service worker not available');
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        this.serviceWorker!.postMessage(
          {
            type: 'CACHE_ROUTE',
            data: route,
          },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('[OfflineCache] Failed to cache route:', error);
      return false;
    }
  }

  /**
   * Cache multiple leads for offline access
   */
  async cacheLeads(leads: any[]): Promise<boolean> {
    if (!this.serviceWorker) {
      console.warn('[OfflineCache] Service worker not available');
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        this.serviceWorker!.postMessage(
          {
            type: 'CACHE_LEADS',
            data: leads,
          },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('[OfflineCache] Failed to cache leads:', error);
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<boolean> {
    if (!this.serviceWorker) {
      console.warn('[OfflineCache] Service worker not available');
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        this.serviceWorker!.postMessage(
          {
            type: 'CLEAR_CACHE',
          },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('[OfflineCache] Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    if (!this.serviceWorker) {
      return {
        totalSize: 0,
        routeCount: 0,
        leadCount: 0,
        lastSync: null,
      };
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          const size = event.data.size;
          const lastSyncStr = localStorage.getItem('offline-last-sync');
          
          resolve({
            totalSize: size,
            routeCount: 0, // TODO: Implement count
            leadCount: 0, // TODO: Implement count
            lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
          });
        };

        this.serviceWorker!.postMessage(
          {
            type: 'GET_CACHE_SIZE',
          },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('[OfflineCache] Failed to get cache stats:', error);
      return {
        totalSize: 0,
        routeCount: 0,
        leadCount: 0,
        lastSync: null,
      };
    }
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Add item to sync queue
   */
  addToSyncQueue(type: string, data: any): void {
    this.syncQueue.push({ type, data });
    localStorage.setItem('offline-sync-queue', JSON.stringify(this.syncQueue));
  }

  /**
   * Sync queued items when online
   */
  private async syncWhenOnline(): Promise<void> {
    console.log('[OfflineCache] Back online, syncing queued items...');
    
    const queueStr = localStorage.getItem('offline-sync-queue');
    if (!queueStr) {
      return;
    }

    try {
      const queue = JSON.parse(queueStr);
      
      for (const item of queue) {
        // TODO: Implement actual sync logic based on item type
        console.log('[OfflineCache] Syncing item:', item.type);
      }

      // Clear queue after successful sync
      this.syncQueue = [];
      localStorage.removeItem('offline-sync-queue');
      localStorage.setItem('offline-last-sync', new Date().toISOString());
      
      console.log('[OfflineCache] Sync complete');
    } catch (error) {
      console.error('[OfflineCache] Sync failed:', error);
    }
  }

  /**
   * Handle offline state
   */
  private handleOffline(): void {
    console.log('[OfflineCache] Offline mode activated');
  }

  /**
   * Download route for offline use
   */
  async downloadRouteForOffline(routeId: number, routeData: any, leads: any[]): Promise<boolean> {
    try {
      // Cache route data
      const routeCached = await this.cacheRoute(routeData);
      if (!routeCached) {
        return false;
      }

      // Cache associated leads
      const leadsCached = await this.cacheLeads(leads);
      if (!leadsCached) {
        return false;
      }

      // Store offline route metadata
      const offlineRoutes = this.getOfflineRoutes();
      offlineRoutes.push({
        id: routeId,
        name: routeData.routeName,
        stops: routeData.stops || [],
        totalDistance: routeData.totalDistance || 0,
        estimatedTime: routeData.estimatedTime || 0,
        cachedAt: new Date(),
      });
      localStorage.setItem('offline-routes', JSON.stringify(offlineRoutes));

      console.log('[OfflineCache] Route downloaded for offline use:', routeId);
      return true;
    } catch (error) {
      console.error('[OfflineCache] Failed to download route:', error);
      return false;
    }
  }

  /**
   * Get list of offline routes
   */
  getOfflineRoutes(): CachedRoute[] {
    const routesStr = localStorage.getItem('offline-routes');
    if (!routesStr) {
      return [];
    }

    try {
      return JSON.parse(routesStr);
    } catch {
      return [];
    }
  }

  /**
   * Remove offline route
   */
  removeOfflineRoute(routeId: number): void {
    const routes = this.getOfflineRoutes();
    const filtered = routes.filter((r) => r.id !== routeId);
    localStorage.setItem('offline-routes', JSON.stringify(filtered));
  }
}

// Export singleton instance
export const offlineCache = new OfflineCacheManager();
