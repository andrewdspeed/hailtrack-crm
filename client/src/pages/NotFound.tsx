import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useDemoPermissions } from "@/hooks/useDemoPermissions";
import { AlertCircle, Home, MapPin, Users, BarChart3, Settings } from "lucide-react";

export default function NotFound() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { isAdmin } = useDemoPermissions();

  const suggestions = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: MapPin, label: "Map", path: "/map" },
    { icon: Users, label: "Leads", path: "/leads" },
    { icon: Users, label: "Customers", path: "/customers" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ];

  if (isAdmin) {
    suggestions.push({ icon: Settings, label: "User Management", path: "/users" });
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Error Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-100 rounded-full blur-2xl opacity-50"></div>
                <AlertCircle className="w-24 h-24 text-red-600 relative" />
              </div>
            </div>
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <h2 className="text-3xl font-bold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground text-lg mb-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
            {user && (
              <p className="text-sm text-muted-foreground">
                Welcome back, <span className="font-semibold">{user.name}</span>!
              </p>
            )}
          </div>

          {/* Personalized Suggestions */}
          <Card className="p-8 mb-8">
            <h3 className="text-lg font-semibold mb-6">Here are some helpful links:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <Button
                    key={suggestion.path}
                    variant="outline"
                    className="h-auto flex flex-col items-center justify-center py-4 gap-2"
                    onClick={() => setLocation(suggestion.path)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs text-center">{suggestion.label}</span>
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/")}>
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>

          {/* Additional Help */}
          {user?.role === "admin" && (
            <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Admin Notice</h4>
              <p className="text-sm text-blue-800">
                If you believe this is an error, check the application logs or contact the development team.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
