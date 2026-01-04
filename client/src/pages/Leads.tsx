import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, MapPin, Phone, Mail, Clock, User, Bell, Calendar, Sheet, BarChart3, Camera, FileUp } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import BulkActionsToolbar from "@/components/BulkActionsToolbar";

export default function Leads() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  const { data: leads, isLoading, refetch } = trpc.leads.list.useQuery();
  const { data: allTags } = trpc.tags.list.useQuery();

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeadIds(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads?.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads?.map(l => l.id) || []);
    }
  };

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Leads</h1>
                  <p className="text-muted-foreground">
                    {isLoading ? "Loading..." : `${filteredLeads?.length || 0} leads`}
                  </p>
                </div>
                <OfflineIndicator />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setLocation("/spreadsheet")} variant="outline">
                <Sheet className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Spreadsheet View</span>
              </Button>
              <Button onClick={() => setLocation("/leads/import")} variant="outline">
                <FileUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import Forms</span>
              </Button>
              <Button onClick={() => setLocation("/leads/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            {filteredLeads && filteredLeads.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_shop">In Shop</SelectItem>
                <SelectItem value="awaiting_pickup">Awaiting Pickup</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading leads...</div>
        ) : filteredLeads && filteredLeads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => setLocation(`/leads/${lead.id}`)}
                isSelected={selectedLeadIds.includes(lead.id)}
                onToggleSelect={() => toggleLeadSelection(lead.id)}
                tags={allTags || []}
                onRefresh={refetch}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No leads found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Start by creating your first lead"}
            </p>
            <Button onClick={() => setLocation("/leads/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </div>
        )}
      </div>
      </div>
      <BulkActionsToolbar
        selectedLeadIds={selectedLeadIds}
        onClearSelection={() => setSelectedLeadIds([])}
        onActionComplete={() => {
          refetch();
          setSelectedLeadIds([]);
        }}
      />
    </AppLayout>
  );
}

function LeadCard({ lead, onClick, isSelected, onToggleSelect, tags, onRefresh }: {
  lead: any;
  onClick: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  tags: any[];
  onRefresh: () => void;
}) {
  const cooldownStatus = getCooldownStatus(lead.lastFollowUpAt);
  const { data: leadTags } = trpc.tags.getLeadTags.useQuery({ leadId: lead.id });
  const addTagMutation = trpc.tags.addToLead.useMutation();
  const removeTagMutation = trpc.tags.removeFromLead.useMutation();

  const handleToggleTag = async (e: React.MouseEvent, tagId: number) => {
    e.stopPropagation();
    const hasTag = leadTags?.some(t => t.id === tagId);
    try {
      if (hasTag) {
        await removeTagMutation.mutateAsync({ leadId: lead.id, tagId });
      } else {
        await addTagMutation.mutateAsync({ leadId: lead.id, tagId });
      }
      onRefresh();
    } catch (error: any) {
      console.error('Failed to toggle tag:', error);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(e) => {
                e.stopPropagation?.();
                onToggleSelect();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">
              {lead.name || "Unnamed Lead"}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {lead.address}
            </p>
          </div>
          </div>
          {cooldownStatus && (
            <div className={`ml-2 p-1.5 rounded-full ${getCooldownColor(cooldownStatus)}`}>
              <Clock className="h-3 w-3" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary"
            style={{ 
              backgroundColor: `${getStatusColor(lead.status)}20`,
              color: getStatusColor(lead.status),
              borderColor: getStatusColor(lead.status)
            }}
            className="border"
          >
            {formatStatus(lead.status)}
          </Badge>
          {lead.subStatus && (
            <Badge variant="outline" className="text-xs">
              {formatStatus(lead.subStatus)}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {leadTags && leadTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {leadTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs cursor-pointer hover:opacity-70"
                style={{
                  backgroundColor: `${tag.color}15`,
                  borderColor: tag.color,
                  color: tag.color,
                }}
                onClick={(e) => handleToggleTag(e, tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Photo Count */}
        {lead.photoCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Camera className="h-3.5 w-3.5" />
            <span>{lead.photoCount} photo{lead.photoCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-1.5 text-sm">
          {lead.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{lead.email}</span>
            </div>
          )}
          {lead.agentName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{lead.agentName}</span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Created {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
}

function getCooldownStatus(lastFollowUpAt: Date | null): "red" | "yellow" | "green" | null {
  if (!lastFollowUpAt) return null;

  const hoursSince = (Date.now() - new Date(lastFollowUpAt).getTime()) / (1000 * 60 * 60);

  if (hoursSince < 48) return "red";
  if (hoursSince < 72) return "yellow";
  return "green";
}

function getCooldownColor(status: "red" | "yellow" | "green"): string {
  const colors = {
    red: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
    green: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
  };
  return colors[status];
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    lead: "#3b82f6",
    scheduled: "#f59e0b",
    in_shop: "#8b5cf6",
    awaiting_pickup: "#10b981",
    complete: "#6b7280",
  };
  return colors[status] || colors.lead;
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
