import { Bell, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import TabNavigation from "@/components/TabNavigation";
import { DemoModeToggle } from "@/components/DemoModeToggle";
import { TourButton } from "@/components/TourButton";
import { TourOverlay } from "@/components/TourOverlay";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { useLocation } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAdmin } = usePermissions();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              H
            </div>
            <div>
              <h1 className="text-sm font-bold">Hail Solutions Group</h1>
              <p className="text-xs text-muted-foreground">Field Sales CRM</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <OfflineIndicator />
            
            <TourButton />
            
            <DemoModeToggle />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/notifications/settings")}
              className="h-9 w-9"
            >
              <Bell className="h-4 w-4" />
            </Button>

            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/users")}
                className="h-9 w-9"
                title="User Management"
              >
                <Shield className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings")}
              className="h-9 w-9"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <UserProfileDropdown />
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>

      {/* Tour Overlay */}
      <TourOverlay />
    </div>
  );
}
