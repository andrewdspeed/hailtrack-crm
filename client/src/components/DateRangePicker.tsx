import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value?: { startDate?: string; endDate?: string };
  onChange: (range: { startDate?: string; endDate?: string }) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>(() => {
    if (value?.startDate && value?.endDate) {
      return {
        from: new Date(value.startDate),
        to: new Date(value.endDate),
      };
    }
    return undefined;
  });

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from && newDate?.to) {
      onChange({
        startDate: format(newDate.from, "yyyy-MM-dd"),
        endDate: format(newDate.to, "yyyy-MM-dd"),
      });
    } else if (!newDate) {
      onChange({});
    }
  };

  const applyPreset = (preset: string) => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (preset) {
      case "today":
        from = now;
        break;
      case "yesterday":
        from = subDays(now, 1);
        to = subDays(now, 1);
        break;
      case "last7":
        from = subDays(now, 7);
        break;
      case "last30":
        from = subDays(now, 30);
        break;
      case "thisMonth":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "lastMonth":
        from = startOfMonth(subDays(now, 30));
        to = endOfMonth(subDays(now, 30));
        break;
      case "thisQuarter":
        from = startOfQuarter(now);
        to = endOfQuarter(now);
        break;
      case "thisYear":
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      default:
        return;
    }

    const newRange = { from, to };
    setDate(newRange);
    onChange({
      startDate: format(from, "yyyy-MM-dd"),
      endDate: format(to, "yyyy-MM-dd"),
    });
  };

  const clearRange = () => {
    setDate(undefined);
    onChange({});
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets sidebar */}
            <div className="flex flex-col gap-1 border-r p-3">
              <div className="text-xs font-semibold mb-2">Quick Select</div>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => applyPreset("today")}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => applyPreset("yesterday")}
              >
                Yesterday
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => applyPreset("last7")}
              >
                Last 7 Days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => applyPreset("last30")}
              >
                Last 30 Days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => applyPreset("thisMonth")}
              >
                This Month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => applyPreset("lastMonth")}
              >
                Last Month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => applyPreset("thisQuarter")}
              >
                This Quarter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => applyPreset("thisYear")}
              >
                This Year
              </Button>
              <div className="border-t mt-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs h-8 w-full"
                  onClick={clearRange}
                >
                  Clear
                </Button>
              </div>
            </div>
            
            {/* Calendar */}
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
