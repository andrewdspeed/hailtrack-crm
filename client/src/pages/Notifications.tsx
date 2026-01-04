import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);

  const sendTestMutation = trpc.notifications.sendTest.useMutation();

  const handleSendTest = async () => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      await sendTestMutation.mutateAsync({
        userId: user.id,
        userName: user.name || "Agent",
        userPhone: undefined,
        userEmail: user.email || undefined,
      });
      toast.success("Test notification sent! Check your email, SMS, and browser notifications.");
    } catch (error) {
      toast.error("Failed to send test notification");
    }
  };

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser doesn't support push notifications");
      return;
    }

    if (Notification.permission === "granted") {
      toast.success("Push notifications already enabled");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error("Push notifications are blocked. Please enable them in your browser settings.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Push notifications enabled!");
      new Notification("Hail Solutions Group", {
        body: "You'll now receive notifications about leads and follow-ups",
        icon: "/favicon.ico",
      });
    } else {
      toast.error("Push notification permission denied");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => setLocation("/leads")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notification Settings</h1>
              <p className="text-muted-foreground">Manage how you receive updates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Browser Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Browser Push Notifications
            </CardTitle>
            <CardDescription>
              Get instant alerts in your browser when leads need attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive desktop notifications for new leads and follow-ups
                </p>
              </div>
              <Switch
                checked={pushEnabled}
                onCheckedChange={(checked) => {
                  setPushEnabled(checked);
                  if (checked) {
                    requestPushPermission();
                  }
                }}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">You'll be notified about:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• New leads assigned to you</li>
                <li>• Follow-up cooldown expiration (ready to contact again)</li>
                <li>• Status changes (scheduled, in shop, ready for pickup)</li>
              </ul>
            </div>

            {Notification.permission === "denied" && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                ⚠️ Push notifications are blocked. Please enable them in your browser settings.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Receive email updates and daily digests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get emails for important lead updates
                </p>
              </div>
              <Switch
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Email notifications include:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Daily digest of leads needing follow-up</li>
                <li>• Status change alerts</li>
                <li>• New lead assignments</li>
              </ul>
            </div>

            {user?.email && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                📧 Emails will be sent to: <span className="font-medium">{user.email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Get text messages for urgent updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive text messages for time-sensitive alerts
                </p>
              </div>
              <Switch
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">SMS alerts for:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• New leads assigned to you</li>
                <li>• Follow-up reminders</li>
                <li>• Critical status changes</li>
              </ul>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 rounded-lg text-sm">
              ℹ️ To receive SMS notifications, add your phone number in your profile settings
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 rounded-lg text-sm">
              ℹ️ Standard SMS rates may apply depending on your carrier
            </div>
          </CardContent>
        </Card>

        {/* Test Notification */}
        <Card>
          <CardHeader>
            <CardTitle>Test Notifications</CardTitle>
            <CardDescription>
              Send a test notification to verify your settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSendTest} 
              disabled={sendTestMutation.isPending}
              className="w-full"
            >
              {sendTestMutation.isPending ? "Sending..." : "Send Test Notification"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
