import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OfflineSyncProvider } from "./contexts/OfflineSyncContext";
import MapView from "./pages/MapView";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import NewLead from "./pages/NewLead";
import ImportLeads from "./pages/ImportLeads";
import LeadDetail from "./pages/LeadDetail";
import Notifications from "./pages/Notifications";
import CalendarSettings from "./pages/CalendarSettings";
import Customers from "./pages/Customers";
import SpreadsheetView from "./pages/SpreadsheetView";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/UserManagement";
import LoanerVehicles from "./pages/LoanerVehicles";
import Technicians from "./pages/Technicians";
import KanbanPage from "./pages/Kanban";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/map" component={MapView} />
      <Route path="/leads" component={Leads} />
      <Route path="/leads/new" component={NewLead} />
      <Route path="/leads/import" component={ImportLeads} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/calendar" component={CalendarSettings} />
      <Route path="/customers" component={Customers} />
      <Route path="/spreadsheet" component={SpreadsheetView} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/users" component={UserManagement} />
      <Route path="/loaners" component={LoanerVehicles} />
      <Route path="/technicians" component={Technicians} />
      <Route path="/kanban" component={KanbanPage} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <OfflineSyncProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </OfflineSyncProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
