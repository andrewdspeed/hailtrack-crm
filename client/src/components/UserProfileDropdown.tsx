import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Settings, LogOut, Shield } from "lucide-react";

export function UserProfileDropdown() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const handleLogout = () => {
    // Clear demo mode if active
    localStorage.removeItem("demo_mode");
    localStorage.removeItem("demo_user");
    document.cookie = "demo_auth=; path=/; max-age=0";
    
    // Redirect to login
    window.location.href = "/api/auth/logout";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <div className="font-semibold">{user.name || "User"}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setLocation("/profile")}>
          <User className="w-4 h-4 mr-2" />
          View Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setLocation("/settings")}>
          <Settings className="w-4 h-4 mr-2" />
          Personalization
        </DropdownMenuItem>

        {user.role === "admin" && (
          <DropdownMenuItem onClick={() => setLocation("/users")}>
            <Shield className="w-4 h-4 mr-2" />
            User Management
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
