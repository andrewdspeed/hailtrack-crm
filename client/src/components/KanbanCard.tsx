import { Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, User } from "lucide-react";
import { useLocation } from "wouter";

interface KanbanCardProps {
  lead: {
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
  };
  index: number;
}

export function KanbanCard({ lead, index }: KanbanCardProps) {
  const [, setLocation] = useLocation();

  const handleCardClick = () => {
    setLocation(`/leads/${lead.id}`);
  };

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    switch (action) {
      case "call":
        window.location.href = `tel:${lead.phone}`;
        break;
      case "email":
        window.location.href = `mailto:${lead.phone}`;
        break;
    }
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
        >
          <Card
            onClick={handleCardClick}
            className={`p-3 cursor-move transition-all ${
              snapshot.isDragging
                ? "shadow-lg ring-2 ring-primary"
                : "hover:shadow-md"
            }`}
          >
            {/* Header: Name and Tags */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{lead.name || "Unknown"}</h4>
                {lead.agent_name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" />
                    {lead.agent_name}
                  </p>
                )}
              </div>
              {lead.tags && lead.tags.length > 0 && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {lead.tags[0].name}
                </Badge>
              )}
            </div>

            {/* Vehicle Info */}
            {(lead.vehicle_year || lead.vehicle_make || lead.vehicle_model) && (
              <p className="text-xs text-muted-foreground mb-2 truncate">
                {[lead.vehicle_year, lead.vehicle_make, lead.vehicle_model]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}

            {/* Address */}
            <div className="flex gap-1 text-xs text-muted-foreground mb-2 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span className="truncate">{lead.address}</span>
            </div>

            {/* Technician if assigned */}
            {lead.technician_name && (
              <p className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded mb-2 truncate">
                Tech: {lead.technician_name}
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => handleQuickAction(e, "call")}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded transition-colors"
              >
                <Phone className="w-3 h-3" />
                Call
              </button>
              <button
                onClick={(e) => handleQuickAction(e, "email")}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
              >
                <Mail className="w-3 h-3" />
                Email
              </button>
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
