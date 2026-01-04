import { useDemo, DEMO_USERS } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export function DemoModeToggle() {
  const { isDemoMode, demoUser, setDemoMode } = useDemo();

  if (!isDemoMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDemoMode(true, DEMO_USERS.admin)}
        className="gap-2"
      >
        <Zap className="w-4 h-4" />
        <span className="hidden sm:inline">Demo Mode</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Zap className="w-4 h-4" />
          <Badge variant="secondary" className="ml-1">
            {demoUser?.role.toUpperCase()}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Demo Mode - Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setDemoMode(true, DEMO_USERS.admin)}>
          <div className="flex flex-col gap-1 w-full">
            <span className="font-medium">Admin</span>
            <span className="text-xs text-muted-foreground">Full system access</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setDemoMode(true, DEMO_USERS.sales)}>
          <div className="flex flex-col gap-1 w-full">
            <span className="font-medium">Sales Agent</span>
            <span className="text-xs text-muted-foreground">Lead management</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setDemoMode(true, DEMO_USERS.appraiser)}>
          <div className="flex flex-col gap-1 w-full">
            <span className="font-medium">Appraiser</span>
            <span className="text-xs text-muted-foreground">Damage assessment</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setDemoMode(false)}
          className="text-red-600 focus:text-red-600"
        >
          Exit Demo Mode
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
