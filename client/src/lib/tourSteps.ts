import { TourStep } from "@/contexts/TourContext";

export const DASHBOARD_TOUR: TourStep[] = [
  {
    id: "dashboard-welcome",
    title: "Welcome to Hail Solutions CRM",
    description:
      "This guided tour will show you the key features of the dashboard. Let's start with an overview of your operations.",
    target: "body",
    position: "center",
  },
  {
    id: "dashboard-metrics",
    title: "Key Metrics",
    description:
      "At a glance, see today's new leads, follow-ups due, active leads, and completion status. These metrics update in real-time.",
    target: ".dashboard-metrics",
    position: "bottom",
    highlightPadding: 15,
  },
  {
    id: "dashboard-operations",
    title: "Today's Operations",
    description:
      "Monitor your team's assignments, available loaner vehicles, and pending inspections. This helps you manage daily operations efficiently.",
    target: ".dashboard-operations",
    position: "bottom",
    highlightPadding: 15,
  },
  {
    id: "dashboard-performance",
    title: "Performance Metrics",
    description:
      "Track average repair times, customer satisfaction scores, and revenue metrics to measure team performance.",
    target: ".dashboard-performance",
    position: "bottom",
    highlightPadding: 15,
  },
  {
    id: "dashboard-navigation",
    title: "Navigation Tabs",
    description:
      "Use these tabs to navigate between Dashboard, Map, Pipeline (Kanban), Leads, Customers, and Analytics. Each view provides different insights.",
    target: ".tab-navigation",
    position: "bottom",
    highlightPadding: 10,
  },
];

export const MAP_TOUR: TourStep[] = [
  {
    id: "map-welcome",
    title: "Interactive Map View",
    description:
      "The map shows all your leads geographically. This helps you identify clusters and plan efficient routes for your team.",
    target: "body",
    position: "center",
  },
  {
    id: "map-heatmap",
    title: "Hail Damage Heat Map",
    description:
      "When Hail Recon API is configured, you'll see real-time hail damage areas overlaid on the map. This helps identify high-opportunity zones.",
    target: ".map-container",
    position: "bottom",
    highlightPadding: 15,
  },
  {
    id: "map-leads",
    title: "Lead Markers",
    description:
      "Each marker represents a lead. Click on any marker to view lead details, assign technicians, or update status.",
    target: ".map-container",
    position: "bottom",
    highlightPadding: 15,
  },
  {
    id: "map-filters",
    title: "Filter Options",
    description:
      "Filter leads by status, agent, or date range to focus on specific leads. This helps you manage your pipeline effectively.",
    target: ".map-filters",
    position: "bottom",
    highlightPadding: 10,
  },
];

export const KANBAN_TOUR: TourStep[] = [
  {
    id: "kanban-welcome",
    title: "Lead Pipeline (Kanban Board)",
    description:
      "This is your lead workflow. Drag and drop leads between columns to update their status as they move through your process.",
    target: "body",
    position: "center",
  },
  {
    id: "kanban-columns",
    title: "Pipeline Stages",
    description:
      "Your leads flow through 5 stages: Lead (new), Scheduled (appointment set), In Shop (repair in progress), Awaiting Pickup (ready for customer), and Complete (finished).",
    target: ".kanban-board-container",
    position: "bottom",
    highlightPadding: 15,
  },
  {
    id: "kanban-drag-drop",
    title: "Drag & Drop Status Updates",
    description:
      "Grab any lead card and drag it to the next column to update its status. Changes sync in real-time across your team.",
    target: ".kanban-board-container",
    position: "bottom",
    highlightPadding: 15,
  },
  {
    id: "kanban-cards",
    title: "Lead Cards",
    description:
      "Each card shows the customer name, vehicle info, address, assigned technician, and quick action buttons (call/email).",
    target: ".kanban-board-container",
    position: "bottom",
    highlightPadding: 15,
  },
  {
    id: "kanban-metrics",
    title: "Stage Metrics",
    description:
      "See the number of leads in each stage and average days spent in that stage. This helps identify bottlenecks.",
    target: ".kanban-board-container",
    position: "bottom",
    highlightPadding: 15,
  },
  {
    id: "kanban-filter",
    title: "Filter by Agent",
    description:
      "Filter the board to show only leads assigned to a specific agent. Great for team-focused reviews.",
    target: ".kanban-filters",
    position: "bottom",
    highlightPadding: 10,
  },
];

export const FULL_APP_TOUR: TourStep[] = [
  ...DASHBOARD_TOUR,
  {
    id: "app-header",
    title: "App Header",
    description:
      "Access notifications, settings, user profile, and demo mode toggle from the header. Demo mode lets you explore without authentication.",
    target: "header",
    position: "bottom",
    highlightPadding: 10,
  },
  ...MAP_TOUR.slice(1),
  ...KANBAN_TOUR.slice(1),
];
