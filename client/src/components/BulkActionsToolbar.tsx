import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, Tag, Edit } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface BulkActionsToolbarProps {
  selectedLeadIds: number[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export default function BulkActionsToolbar({
  selectedLeadIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsToolbarProps) {
  const { data: tags } = trpc.tags.list.useQuery();
  const updateStatusMutation = trpc.bulk.updateStatus.useMutation();
  const addTagMutation = trpc.bulk.addTag.useMutation();

  const handleUpdateStatus = async (status: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        leadIds: selectedLeadIds,
        status,
      });
      toast.success(`Updated ${selectedLeadIds.length} leads to ${status}`);
      onActionComplete();
      onClearSelection();
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  const handleAddTag = async (tagId: number, tagName: string) => {
    try {
      await addTagMutation.mutateAsync({
        leadIds: selectedLeadIds,
        tagId,
      });
      toast.success(`Added "${tagName}" tag to ${selectedLeadIds.length} leads`);
      onActionComplete();
    } catch (error: any) {
      toast.error(`Failed to add tag: ${error.message}`);
    }
  };

  if (selectedLeadIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <Card className="shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {selectedLeadIds.length} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Update Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleUpdateStatus("lead")}>
                  New Lead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("scheduled")}>
                  Scheduled
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("in_shop")}>
                  In Shop
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("awaiting_pickup")}>
                  Awaiting Pickup
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("complete")}>
                  Complete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Tag */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Add Tag</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tags?.map((tag) => (
                  <DropdownMenuItem
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id, tag.name)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
