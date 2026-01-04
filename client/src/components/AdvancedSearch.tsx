import { useState } from "react";
import { Search, Filter, X, Calendar, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface SearchFilters {
  query: string;
  status: string;
  assignedTo: string;
  dateFrom: string;
  dateTo: string;
  hasPhotos: boolean | null;
  hasDocuments: boolean | null;
  needsFollowUp: boolean;
}

interface SavedFilter {
  name: string;
  filters: SearchFilters;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
}

const QUICK_FILTERS = [
  { label: "Needs Follow-up", key: "needsFollowUp", value: true },
  { label: "Has Photos", key: "hasPhotos", value: true },
  { label: "Has Documents", key: "hasDocuments", value: true },
  { label: "New Leads", key: "status", value: "lead" },
  { label: "In Shop", key: "status", value: "in_shop" },
];

export default function AdvancedSearch({ onSearch, currentFilters }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(currentFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const saved = localStorage.getItem("savedFilters");
    return saved ? JSON.parse(saved) : [];
  });
  const [filterName, setFilterName] = useState("");

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleQuickFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: SearchFilters = {
      query: "",
      status: "",
      assignedTo: "",
      dateFrom: "",
      dateTo: "",
      hasPhotos: null,
      hasDocuments: null,
      needsFollowUp: false,
    };
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };

  const saveCurrentFilters = () => {
    if (!filterName.trim()) return;
    
    const newSaved = [...savedFilters, { name: filterName, filters }];
    setSavedFilters(newSaved);
    localStorage.setItem("savedFilters", JSON.stringify(newSaved));
    setFilterName("");
  };

  const loadSavedFilter = (saved: SavedFilter) => {
    setFilters(saved.filters);
    onSearch(saved.filters);
  };

  const deleteSavedFilter = (index: number) => {
    const newSaved = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(newSaved);
    localStorage.setItem("savedFilters", JSON.stringify(newSaved));
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "query") return value !== "";
    if (typeof value === "boolean") return value === true;
    return value !== "" && value !== null;
  }).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, address, VIN, claim #..."
            value={filters.query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Advanced Filters</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              {/* Status Filter */}
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_shop">In Shop</SelectItem>
                    <SelectItem value="awaiting_pickup">Awaiting Pickup</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  />
                </div>
                <div>
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  />
                </div>
              </div>

              {/* Save Filter */}
              <div className="pt-4 border-t">
                <Label>Save This Filter</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Filter name..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                  <Button onClick={saveCurrentFilters} disabled={!filterName.trim()}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div className="pt-4 border-t">
                  <Label className="mb-2 block">Saved Filters</Label>
                  <div className="space-y-2">
                    {savedFilters.map((saved, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded border">
                        <button
                          onClick={() => loadSavedFilter(saved)}
                          className="flex-1 text-left text-sm hover:underline"
                        >
                          {saved.name}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSavedFilter(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((qf) => {
          const isActive = (filters as any)[qf.key] === qf.value;
          return (
            <Button
              key={qf.label}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilter(qf.key, isActive ? (qf.key === "status" ? "" : null) : qf.value)}
            >
              {qf.label}
              {isActive && <X className="h-3 w-3 ml-1" />}
            </Button>
          );
        })}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {filters.query && (
            <Badge variant="secondary">
              Search: "{filters.query}"
              <button
                onClick={() => handleFilterChange("query", "")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary">
              Status: {filters.status}
              <button
                onClick={() => handleFilterChange("status", "")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="secondary">
              From: {filters.dateFrom}
              <button
                onClick={() => handleFilterChange("dateFrom", "")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary">
              To: {filters.dateTo}
              <button
                onClick={() => handleFilterChange("dateTo", "")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
