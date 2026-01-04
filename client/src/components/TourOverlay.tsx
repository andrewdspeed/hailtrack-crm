import { useTour } from "@/contexts/TourContext";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, endTour, getCurrentStep } = useTour();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const currentTourStep = getCurrentStep();

  useEffect(() => {
    if (!isActive || !currentTourStep) return;

    const updateHighlight = () => {
      const element = document.querySelector(currentTourStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);

        // Calculate tooltip position
        const padding = currentTourStep.highlightPadding || 10;
        const tooltipWidth = 320;
        const tooltipHeight = 200;

        let top = rect.top - tooltipHeight - padding;
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;

        // Adjust if tooltip goes off-screen
        if (top < 10) {
          top = rect.bottom + padding;
        }
        if (left < 10) {
          left = 10;
        }
        if (left + tooltipWidth > window.innerWidth - 10) {
          left = window.innerWidth - tooltipWidth - 10;
        }

        setTooltipPosition({ top, left });
      }
    };

    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    return () => window.removeEventListener("resize", updateHighlight);
  }, [isActive, currentTourStep]);

  if (!isActive || !currentTourStep) return null;

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={endTour} />

      {/* Highlight box */}
      {highlightRect && (
        <div
          className="fixed border-2 border-primary rounded-lg pointer-events-none z-40 shadow-lg"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed bg-white rounded-lg shadow-xl z-50 p-6 max-w-sm"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          width: "320px",
        }}
      >
        {/* Close button */}
        <button
          onClick={endTour}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="pr-6">
          <h3 className="font-semibold text-lg mb-2">{currentTourStep.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {currentTourStep.description}
          </p>

          {/* Step counter */}
          <div className="text-xs text-muted-foreground mb-4">
            Step {currentStep + 1} of {steps.length}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-200 rounded-full mb-4">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                size="sm"
                onClick={nextStep}
                className="flex-1"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={endTour}
                className="flex-1"
              >
                Finish
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={endTour}
              className="px-2"
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
