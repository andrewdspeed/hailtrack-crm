import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Mail, Phone, MapPin, Shield, Calendar } from "lucide-react";
import { useDemoPermissions } from "@/hooks/useDemoPermissions";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { isAdmin } = useDemoPermissions();

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const joinDate = user.lastSignedIn
    ? new Date(user.lastSignedIn).toLocaleDateString()
    : "N/A";

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-muted-foreground capitalize">
                    {user.role || "User"}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setLocation("/settings")}
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Settings
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Account Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email */}
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">{user.email || "Not provided"}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-4">
              <Shield className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="text-base capitalize">{user.role || "User"}</p>
              </div>
            </div>

            {/* Last Sign In */}
            <div className="flex items-start gap-4">
              <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Sign In</p>
                <p className="text-base">{joinDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Your access level and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isAdmin ? (
                <>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Administrator - Full system access
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You have full access to all features, user management, analytics, and system settings.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Standard User - Limited access
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You have access to leads, customers, and basic features. Contact your administrator for additional permissions.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Personalization Settings
            </Button>

            {isAdmin && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setLocation("/users")}
              >
                <Shield className="w-4 h-4 mr-2" />
                User Management
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
