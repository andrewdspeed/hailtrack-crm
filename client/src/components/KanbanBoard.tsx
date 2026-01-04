import { useState, useEffect, useMemo, useRef } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { KanbanColumn } from "./KanbanColumn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Filter } from "lucide-react";
import { toast } from "sonner";

const STATUSES = [
  { id: "lead", label: "Lead" },
  { id: "scheduled", label: "Scheduled" },
  { id: "in_shop", label: "In Shop" },
  { id: "awaiting_pickup", label: "Awaiting Pickup" },
  { id: "complete", label: "Complete" },
];

export function KanbanBoard() {
  const [filterAgent, setFilterAgent] = useState<string>("");
  const [leads, setLeads] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all leads
  const { data: leadsData, isLoading, refetch } = trpc.leads.getAll.useQuery();

  // Update lead status mutation
  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Lead status updated");
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error) => {
      toast.error("Failed to update lead status");
      console.error(error);
    },
  });

  useEffect(() => {
    if (leadsData) {
      setLeads(leadsData);
    }
  }, [leadsData]);

  // Set up polling for real-time sync every 3 seconds
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      refetch();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [refetch]);

  // Filter leads by agent if selected
  const filteredLeads = useMemo(() => {
    if (!filterAgent) return leads;
    return leads.filter((lead) => lead.agent_id === filterAgent);
  }, [leads, filterAgent]);

  // Group leads by status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    STATUSES.forEach((status) => {
      grouped[status.id] = filteredLeads.filter((lead) => lead.status === status.id);
    });
    return grouped;
  }, [filteredLeads]);

  // Get unique agents for filter
  const agents = useMemo(() => {
    const uniqueAgents = new Map();
    leads.forEach((lead) => {
      if (lead.agent_id && !uniqueAgents.has(lead.agent_id)) {
        uniqueAgents.set(lead.agent_id, lead.agent_name || "Unknown");
      }
    });
    return Array.from(uniqueAgents.entries()).map(([id, name]) => ({ id, name }));
  }, [leads]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const lead = leads.find((l) => l.id === draggableId);

    if (!lead) return;

    // Optimistic update
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        l.id === draggableId ? { ...l, status: newStatus } : l
      )
    );

    setIsUpdating(true);

    // Update on server
    updateStatusMutation.mutate({
      leadId: draggableId,
      status: newStatus,
    });

    setIsUpdating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-3 items-center flex-wrap kanban-filters">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or address..."
          onChange={(e) => {
            // TODO: Implement search filtering
          }}
          className="max-w-xs"
        />
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="px-3 py-2 border border-input rounded-md text-sm"
        >
          <option value="">All Agents</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        {filterAgent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterAgent("")}
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 kanban-board-container">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status.id}
              columnId={status.id}
              title={status.label}
              leads={leadsByStatus[status.id]}
              avgDaysInStage={calculateAvgDaysInStage(
                leadsByStatus[status.id]
              )}
            />
          ))}
        </div>
      </DragDropContext>

      {isUpdating && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          Updating...
        </div>
      )}
    </div>
  );
}

function calculateAvgDaysInStage(leads: any[]): number {
  if (leads.length === 0) return 0;

  const now = Date.now();
  const totalDays = leads.reduce((sum, lead) => {
    const createdAt = new Date(lead.created_at).getTime();
    const days = (now - createdAt) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return totalDays / leads.length;
}
