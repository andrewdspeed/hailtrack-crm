import { LayoutDashboard, Map, ListTodo, Users, BarChart3, Trello } from "lucide-react";
import { useLocation } from "wouter";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "map", label: "Map", icon: Map, path: "/map" },
  { id: "kanban", label: "Pipeline", icon: Trello, path: "/kanban" },
  { id: "leads", label: "Leads", icon: ListTodo, path: "/leads" },
  { id: "customers", label: "Customers", icon: Users, path: "/customers" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
];

export default function TabNavigation() {
  const [location, setLocation] = useLocation();

  // Determine active tab based on current location
  const getActiveTab = () => {
    if (location === "/") return "dashboard";
    if (location === "/map") return "map";
    if (location === "/kanban") return "kanban";
    if (location.startsWith("/leads")) return "leads";
    if (location.startsWith("/customers")) return "customers";
    if (location.startsWith("/spreadsheet")) return "leads";
    if (location.startsWith("/analytics")) return "analytics";
    return "map";
  };

  const activeTab = getActiveTab();

  return (
    <div className="border-b border-border bg-background tab-navigation">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setLocation(tab.path)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
