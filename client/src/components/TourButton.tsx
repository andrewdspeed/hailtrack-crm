import { useTour } from "@/contexts/TourContext";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { DASHBOARD_TOUR, MAP_TOUR, KANBAN_TOUR } from "@/lib/tourSteps";
import { useLocation } from "wouter";

export function TourButton() {
  const { startTour } = useTour();
  const [location] = useLocation();

  const handleStartTour = () => {
    // Determine which tour to start based on current page
    if (location === "/") {
      startTour(DASHBOARD_TOUR);
    } else if (location === "/map") {
      startTour(MAP_TOUR);
    } else if (location === "/kanban") {
      startTour(KANBAN_TOUR);
    } else {
      startTour(DASHBOARD_TOUR);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStartTour}
      className="gap-2"
      title="Start guided tour"
    >
      <HelpCircle className="w-4 h-4" />
      <span className="hidden sm:inline">Tour</span>
    </Button>
  );
}
