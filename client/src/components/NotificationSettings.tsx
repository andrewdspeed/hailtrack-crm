import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pushNotifications } from "@/lib/pushNotifications";
import { toast } from "sonner";

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState({
    leadAssignments: true,
    routeUpdates: true,
    territoryAlerts: true,
    routeCompletions: true,
  });

  useEffect(() => {
    // Check initial permission status
    if (pushNotifications.isSupported()) {
      setPermission(pushNotifications.getPermissionStatus());
      
      // Load preferences
      const prefs = pushNotifications.getPreferences();
      setPreferences(prefs);
      
      // Initialize push notifications
      pushNotifications.initialize().then((success) => {
        if (success) {
          setIsSubscribed(true);
        }
      });
    }
  }, []);

  const handleEnableNotifications = async () => {
    // Request permission
    const perm = await pushNotifications.requestPermission();
    setPermission(perm);

    if (perm === 'granted') {
      // Initialize and subscribe
      const initialized = await pushNotifications.initialize();
      if (initialized) {
        const subscription = await pushNotifications.subscribe();
        if (subscription) {
          setIsSubscribed(true);
          toast.success('Notifications enabled successfully');
          
          // Show test notification
          await pushNotifications.showNotification({
            title: '🎉 Notifications Enabled',
            body: 'You will now receive updates about leads and routes',
          });
        } else {
          toast.error('Failed to subscribe to notifications');
        }
      }
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleDisableNotifications = async () => {
    const success = await pushNotifications.unsubscribe();
    if (success) {
      setIsSubscribed(false);
      toast.success('Notifications disabled');
    } else {
      toast.error('Failed to disable notifications');
    }
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    pushNotifications.savePreferences(newPrefs);
    toast.success('Preferences saved');
  };

  const handleTestNotification = async () => {
    await pushNotifications.notifyLeadAssignment(
      'John Doe',
      '123 Main St, Denver, CO'
    );
    toast.success('Test notification sent');
  };

  if (!pushNotifications.isSupported()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about lead assignments, route updates, and alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">
              {permission === 'granted'
                ? 'Notifications are enabled'
                : permission === 'denied'
                ? 'Notifications are blocked'
                : 'Click to enable notifications'}
            </p>
          </div>
          {permission === 'granted' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisableNotifications}
              disabled={!isSubscribed}
            >
              <BellOff className="h-4 w-4 mr-2" />
              Disable
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleEnableNotifications}
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable
            </Button>
          )}
        </div>

        {permission === 'granted' && isSubscribed && (
          <>
            {/* Preferences Section */}
            <div className="space-y-4">
              <Label className="text-base">Notification Preferences</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="lead-assignments">Lead Assignments</Label>
                    <p className="text-sm text-muted-foreground">
                      When new leads are assigned to you
                    </p>
                  </div>
                  <Switch
                    id="lead-assignments"
                    checked={preferences.leadAssignments}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange('leadAssignments', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="route-updates">Route Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      When routes are modified or optimized
                    </p>
                  </div>
                  <Switch
                    id="route-updates"
                    checked={preferences.routeUpdates}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange('routeUpdates', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="territory-alerts">Territory Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      When teammates enter nearby territories
                    </p>
                  </div>
                  <Switch
                    id="territory-alerts"
                    checked={preferences.territoryAlerts}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange('territoryAlerts', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="route-completions">Route Completions</Label>
                    <p className="text-sm text-muted-foreground">
                      When routes are completed with stats
                    </p>
                  </div>
                  <Switch
                    id="route-completions"
                    checked={preferences.routeCompletions}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange('routeCompletions', checked)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Test Notification */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                className="w-full"
              >
                Send Test Notification
              </Button>
            </div>
          </>
        )}

        {permission === 'denied' && (
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
