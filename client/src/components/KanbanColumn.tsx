import { Droppable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { KanbanCard } from "./KanbanCard";
import { Clock } from "lucide-react";

interface KanbanColumnProps {
  columnId: string;
  title: string;
  leads: Array<{
    id: string;
    name: string;
    phone: string;
    address: string;
    status: string;
    agent_id: string;
    agent_name?: string;
    vehicle_year?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    tags?: Array<{ id: string; name: string; color: string }>;
    technician_name?: string;
  }>;
  avgDaysInStage?: number;
}

export function KanbanColumn({ columnId, title, leads, avgDaysInStage }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-full md:w-80 flex-shrink-0">
      {/* Column Header */}
      <Card className="p-4 mb-4 bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
            {leads.length}
          </span>
        </div>
        {avgDaysInStage !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Avg: {avgDaysInStage.toFixed(1)} days
          </div>
        )}
      </Card>

      {/* Droppable Area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-lg p-3 min-h-96 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-primary/10 ring-2 ring-primary"
                : "bg-muted/20"
            }`}
          >
            {leads.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No leads
              </div>
            )}

            {leads.map((lead, index) => (
              <KanbanCard key={lead.id} lead={lead} index={index} />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
