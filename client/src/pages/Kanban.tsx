import { KanbanBoard } from "@/components/KanbanBoard";

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lead Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          Drag and drop leads to update their status in the pipeline
        </p>
      </div>

      <div className="kanban-board">
        <KanbanBoard />
      </div>
    </div>
  );
}
