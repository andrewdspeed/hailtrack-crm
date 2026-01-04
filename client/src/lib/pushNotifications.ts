/**
 * Push Notification Manager
 * Handles web push notifications for lead assignments, route updates, and alerts
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('[PushNotifications] Not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[PushNotifications] Permission:', permission);
      return permission;
    } catch (error) {
      console.error('[PushNotifications] Permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[PushNotifications] Not supported');
      return false;
    }

    try {
      // Wait for service worker to be ready
      this.registration = await navigator.serviceWorker.ready;
      console.log('[PushNotifications] Service worker ready');

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('[PushNotifications] Already subscribed');
        return true;
      }

      return true;
    } catch (error) {
      console.error('[PushNotifications] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.warn('[PushNotifications] Not initialized');
      return null;
    }

    try {
      // Generate VAPID public key (in production, this should come from server)
      const vapidPublicKey = this.getVapidPublicKey();
      
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      this.subscription = subscription;
      console.log('[PushNotifications] Subscribed:', subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('[PushNotifications] Subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      console.log('[PushNotifications] Unsubscribed');
      return true;
    } catch (error) {
      console.error('[PushNotifications] Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Show a local notification (doesn't require push)
   */
  async showNotification(payload: NotificationPayload): Promise<boolean> {
    if (!this.registration) {
      console.warn('[PushNotifications] Not initialized');
      return false;
    }

    if (this.getPermissionStatus() !== 'granted') {
      console.warn('[PushNotifications] Permission not granted');
      return false;
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png',
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        vibrate: [200, 100, 200],
        requireInteraction: false,
      });

      console.log('[PushNotifications] Notification shown:', payload.title);
      return true;
    } catch (error) {
      console.error('[PushNotifications] Show notification failed:', error);
      return false;
    }
  }

  /**
   * Show notification for new lead assignment
   */
  async notifyLeadAssignment(leadName: string, leadAddress: string): Promise<boolean> {
    return this.showNotification({
      title: '🎯 New Lead Assigned',
      body: `${leadName} at ${leadAddress}`,
      tag: 'lead-assignment',
      data: { type: 'lead-assignment' },
      actions: [
        { action: 'view', title: 'View Lead' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }

  /**
   * Show notification for route update
   */
  async notifyRouteUpdate(routeName: string, message: string): Promise<boolean> {
    return this.showNotification({
      title: '🗺️ Route Updated',
      body: `${routeName}: ${message}`,
      tag: 'route-update',
      data: { type: 'route-update' },
      actions: [
        { action: 'view', title: 'View Route' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }

  /**
   * Show notification for territory conflict
   */
  async notifyTerritoryConflict(agentName: string, territoryName: string): Promise<boolean> {
    return this.showNotification({
      title: '⚠️ Territory Alert',
      body: `${agentName} is in ${territoryName}`,
      tag: 'territory-conflict',
      data: { type: 'territory-conflict' },
      actions: [
        { action: 'view', title: 'View Map' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }

  /**
   * Show notification for route completion
   */
  async notifyRouteComplete(routeName: string, stats: string): Promise<boolean> {
    return this.showNotification({
      title: '✅ Route Completed',
      body: `${routeName}: ${stats}`,
      tag: 'route-complete',
      data: { type: 'route-complete' },
      actions: [
        { action: 'view', title: 'View Stats' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }

  /**
   * Get notification preferences from localStorage
   */
  getPreferences(): {
    leadAssignments: boolean;
    routeUpdates: boolean;
    territoryAlerts: boolean;
    routeCompletions: boolean;
  } {
    const prefs = localStorage.getItem('notification-preferences');
    if (!prefs) {
      return {
        leadAssignments: true,
        routeUpdates: true,
        territoryAlerts: true,
        routeCompletions: true,
      };
    }

    try {
      return JSON.parse(prefs);
    } catch {
      return {
        leadAssignments: true,
        routeUpdates: true,
        territoryAlerts: true,
        routeCompletions: true,
      };
    }
  }

  /**
   * Save notification preferences
   */
  savePreferences(prefs: {
    leadAssignments: boolean;
    routeUpdates: boolean;
    territoryAlerts: boolean;
    routeCompletions: boolean;
  }): void {
    localStorage.setItem('notification-preferences', JSON.stringify(prefs));
  }

  /**
   * Helper: Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Get VAPID public key
   * In production, this should be fetched from the server
   */
  private getVapidPublicKey(): string {
    // This is a placeholder key - in production, generate your own VAPID keys
    // and store the public key on the server
    return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYjEB6pSW9TIX3vq_-VPrqvM7hqcNqSw7rxbNGNzrnf_P-7dtjVN8';
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // In production, send this to your backend API
      console.log('[PushNotifications] Subscription to send to server:', JSON.stringify(subscription));
      
      // Store subscription in localStorage as fallback
      localStorage.setItem('push-subscription', JSON.stringify(subscription));
    } catch (error) {
      console.error('[PushNotifications] Failed to send subscription to server:', error);
    }
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationManager();
