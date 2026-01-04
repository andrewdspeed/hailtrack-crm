import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Bell, Globe, Clock, Save, RotateCcw } from "lucide-react";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { preferences, updatePreferences, resetPreferences } = useProfile();
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    theme: preferences.theme || "light",
    language: preferences.language || "en",
    notifications: preferences.notifications !== false,
    emailNotifications: preferences.emailNotifications !== false,
    timezone: preferences.timezone || "America/Denver",
    dateFormat: preferences.dateFormat || "MM/DD/YYYY",
    defaultView: preferences.defaultView || "dashboard",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updatePreferences(formData);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      resetPreferences();
      setFormData({
        theme: "light",
        language: "en",
        notifications: true,
        emailNotifications: true,
        timezone: "America/Denver",
        dateFormat: "MM/DD/YYYY",
        defaultView: "dashboard",
      });
      toast.success("Settings reset to default");
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Personalization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your experience and preferences
          </p>
        </div>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-muted-foreground">{user?.name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-muted-foreground">{user?.email || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <p className="text-muted-foreground capitalize">{user?.role || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <div className="mb-6">
          <NotificationSettings />
        </div>

        {/* Display Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Display Settings
            </CardTitle>
            <CardDescription>
              Customize how the app looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div>
              <label className="text-sm font-medium mb-2 block">Theme</label>
              <select
                value={formData.theme}
                onChange={(e) =>
                  setFormData({ ...formData, theme: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <select
                value={formData.language}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date Format</label>
              <select
                value={formData.dateFormat}
                onChange={(e) =>
                  setFormData({ ...formData, dateFormat: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="text-sm font-medium mb-2 block">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="America/Denver">Mountain Time (Denver)</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            {/* Default View */}
            <div>
              <label className="text-sm font-medium mb-2 block">Default View</label>
              <select
                value={formData.defaultView}
                onChange={(e) =>
                  setFormData({ ...formData, defaultView: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="dashboard">Dashboard</option>
                <option value="map">Map</option>
                <option value="kanban">Pipeline (Kanban)</option>
                <option value="leads">Leads List</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Control how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={(e) =>
                  setFormData({ ...formData, notifications: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">In-app notifications</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emailNotifications: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Email notifications</span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
