import AppLayout from "@/components/AppLayout";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Search, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  Car,
  FileText,
  Calendar,
  User,
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

export default function Customers() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  const { data: leads, isLoading } = trpc.leads.list.useQuery();
  const { data: vehicles } = trpc.vehicles.getByLeadId.useQuery({ leadId: 0 }); // We'll fetch individually

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    if (!leads) return [];

    return leads.filter(lead => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.address?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

      // Agent filter
      const matchesAgent = agentFilter === "all" || lead.agentName === agentFilter;

      return matchesSearch && matchesStatus && matchesAgent;
    });
  }, [leads, searchQuery, statusFilter, agentFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!leads) return { total: 0, active: 0, completed: 0, scheduled: 0 };

    return {
      total: leads.length,
      active: leads.filter(l => l.status === "in_shop" || l.status === "awaiting_pickup").length,
      completed: leads.filter(l => l.status === "complete").length,
      scheduled: leads.filter(l => l.status === "scheduled").length,
    };
  }, [leads]);

  // Get unique agents for filter
  const agents = useMemo(() => {
    if (!leads) return [];
    const agentSet = new Set<string>();
    leads.forEach(l => {
      if (l.agentName) agentSet.add(l.agentName);
    });
    return Array.from(agentSet);
  }, [leads]);

  // Export to CSV
  const handleExport = () => {
    if (!filteredCustomers.length) return;

    const headers = ["Name", "Phone", "Email", "Address", "City", "State", "Status", "Agent", "Created Date"];
    const rows = filteredCustomers.map(customer => [
      customer.name || "",
      customer.phone || "",
      customer.email || "",
      customer.address || "",
      customer.city || "",
      customer.state || "",
      customer.status || "",
      customer.agentName || "",
      customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Customer Database</h1>
              <p className="text-muted-foreground">
                {isLoading ? "Loading..." : `${filteredCustomers.length} of ${leads?.length || 0} customers`}
              </p>
            </div>
          </div>
          <Button onClick={() => setLocation("/leads")}>
            Back to Leads
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold">{stats.scheduled}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Repairs</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, email, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="lead">New Lead</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_shop">In Shop</SelectItem>
                  <SelectItem value="awaiting_pickup">Awaiting Pickup</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>

              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Customer List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading customers...
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No customers found matching your filters
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map(customer => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Customer Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{customer.name || "Unnamed Customer"}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getStatusVariant(customer.status)}>
                              {formatStatus(customer.status)}
                            </Badge>
                            {customer.agentName && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {customer.agentName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${customer.phone}`} className="hover:text-primary">
                              {customer.phone}
                            </a>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${customer.email}`} className="hover:text-primary">
                              {customer.email}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{customer.address}</span>
                        </div>
                        {customer.createdAt && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Added {formatDistanceToNow(new Date(customer.createdAt), { addSuffix: true })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => setLocation(`/leads/${customer.id}`)}
                      >
                        View Details
                      </Button>
                      {customer.latitude && customer.longitude && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLocation("/map")}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          View on Map
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      </div>
    </AppLayout>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    lead: "default",
    scheduled: "secondary",
    in_shop: "outline",
    awaiting_pickup: "secondary",
    complete: "outline",
  };
  return variants[status] || "default";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
