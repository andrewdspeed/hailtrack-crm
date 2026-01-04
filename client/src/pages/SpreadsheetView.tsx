import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Download, 
  Search, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sheet
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

type LeadRow = {
  id: number;
  agentName: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  subStatus: string | null;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  vehicleVin: string | null;
  glassDamage: boolean | null;
  insuranceProvider: string | null;
  insurancePhone: string | null;
  insuranceClaimNumber: string | null;
  insurancePolicyNumber: string | null;
  adjusterName: string | null;
  adjusterPhone: string | null;
  adjusterEmail: string | null;
  adjusterOfficeHours: string | null;
  rentalCarCompany: string | null;
  rentalConfirmationNumber: string | null;
  notes: string | null;
  createdAt: Date | null;
};

export default function SpreadsheetView() {
  const [, setLocation] = useLocation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: leads, isLoading } = trpc.spreadsheet.getAllWithDetails.useQuery();

  // Transform leads data for table
  const tableData = useMemo<LeadRow[]>(() => {
    if (!leads) return [];
    return leads.map((lead: any) => ({
      id: lead.id,
      agentName: lead.agentName,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      status: lead.status,
      subStatus: lead.subStatus,
      vehicleYear: lead.vehicleYear,
      vehicleMake: lead.vehicleMake,
      vehicleModel: lead.vehicleModel,
      vehicleColor: lead.vehicleColor,
      vehicleVin: lead.vehicleVin,
      glassDamage: lead.glassDamage,
      insuranceProvider: lead.insuranceProvider,
      insurancePhone: lead.insurancePhone,
      insuranceClaimNumber: lead.insuranceClaimNumber,
      insurancePolicyNumber: lead.insurancePolicyNumber,
      adjusterName: lead.adjusterName,
      adjusterPhone: lead.adjusterPhone,
      adjusterEmail: lead.adjusterEmail,
      adjusterOfficeHours: lead.adjusterOfficeHours,
      rentalCarCompany: lead.rentalCarCompany || null,
      rentalConfirmationNumber: lead.rentalConfirmationNumber || null,
      notes: lead.notes,
      createdAt: lead.createdAt ? new Date(lead.createdAt) : null,
    }));
  }, [leads]);

  // Define columns
  const columns = useMemo<ColumnDef<LeadRow>[]>(() => [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <SortButton column={column}>ID</SortButton>
      ),
      cell: ({ row }) => (
        <Button 
          variant="link" 
          className="p-0 h-auto font-mono text-xs"
          onClick={() => setLocation(`/leads/${row.original.id}`)}
        >
          #{row.original.id}
        </Button>
      ),
    },
    {
      accessorKey: "agentName",
      header: ({ column }) => (
        <SortButton column={column}>Agent</SortButton>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortButton column={column}>Status</SortButton>
      ),
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status || "")}>
          {formatStatus(row.original.status || "")}
        </Badge>
      ),
    },
    {
      accessorKey: "subStatus",
      header: "Sub-Status",
      cell: ({ row }) => row.original.subStatus || "-",
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortButton column={column}>Customer Name</SortButton>
      ),
      cell: ({ row }) => row.original.name || "-",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "-",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "-",
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => row.original.address || "-",
    },
    {
      accessorKey: "city",
      header: "City",
      cell: ({ row }) => row.original.city || "-",
    },
    {
      accessorKey: "state",
      header: "State",
      cell: ({ row }) => row.original.state || "-",
    },
    {
      accessorKey: "vehicleYear",
      header: "Year",
      cell: ({ row }) => row.original.vehicleYear || "-",
    },
    {
      accessorKey: "vehicleMake",
      header: "Make",
      cell: ({ row }) => row.original.vehicleMake || "-",
    },
    {
      accessorKey: "vehicleModel",
      header: "Model",
      cell: ({ row }) => row.original.vehicleModel || "-",
    },
    {
      accessorKey: "vehicleColor",
      header: "Color",
      cell: ({ row }) => row.original.vehicleColor || "-",
    },
    {
      accessorKey: "vehicleVin",
      header: "VIN",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.vehicleVin || "-"}</span>
      ),
    },
    {
      accessorKey: "glassDamage",
      header: "Glass Damage",
      cell: ({ row }) => (
        <Badge variant={row.original.glassDamage ? "destructive" : "outline"}>
          {row.original.glassDamage ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "insuranceProvider",
      header: "Insurance Provider",
      cell: ({ row }) => row.original.insuranceProvider || "-",
    },
    {
      accessorKey: "insurancePhone",
      header: "Insurance Phone",
      cell: ({ row }) => row.original.insurancePhone || "-",
    },
    {
      accessorKey: "insuranceClaimNumber",
      header: "Claim #",
      cell: ({ row }) => row.original.insuranceClaimNumber || "-",
    },
    {
      accessorKey: "insurancePolicyNumber",
      header: "Policy #",
      cell: ({ row }) => row.original.insurancePolicyNumber || "-",
    },
    {
      accessorKey: "adjusterName",
      header: "Adjuster Name",
      cell: ({ row }) => row.original.adjusterName || "-",
    },
    {
      accessorKey: "adjusterPhone",
      header: "Adjuster Phone",
      cell: ({ row }) => row.original.adjusterPhone || "-",
    },
    {
      accessorKey: "adjusterEmail",
      header: "Adjuster Email",
      cell: ({ row }) => row.original.adjusterEmail || "-",
    },
    {
      accessorKey: "adjusterOfficeHours",
      header: "Adjuster Hours",
      cell: ({ row }) => row.original.adjusterOfficeHours || "-",
    },
    {
      accessorKey: "rentalCarCompany",
      header: "Rental Company",
      cell: ({ row }) => row.original.rentalCarCompany || "-",
    },
    {
      accessorKey: "rentalConfirmationNumber",
      header: "Rental Confirmation",
      cell: ({ row }) => row.original.rentalConfirmationNumber || "-",
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.notes || ""}>
          {row.original.notes || "-"}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortButton column={column}>Created</SortButton>
      ),
      cell: ({ row }) => 
        row.original.createdAt 
          ? formatDistanceToNow(row.original.createdAt, { addSuffix: true })
          : "-",
    },
  ], [setLocation]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Export to CSV
  const handleExport = () => {
    if (!tableData.length) return;

    const headers = columns.map(col => {
      if (typeof col.header === "string") return col.header;
      return String(col.id || "");
    });

    const rows = tableData.map(row => 
      columns.map(col => {
        const key = (col as any).accessorKey as keyof LeadRow;
        const value = row[key];
        if (value === null || value === undefined) return "";
        if (value instanceof Date) return value.toLocaleDateString();
        if (typeof value === "boolean") return value ? "Yes" : "No";
        return String(value);
      })
    );

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-spreadsheet-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-full p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Spreadsheet View</h1>
              <p className="text-muted-foreground">
                {isLoading ? "Loading..." : `${table.getRowModel().rows.length} of ${tableData.length} leads`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setLocation("/leads")}>
              Back to Leads
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all fields..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function SortButton({ column, children }: { column: any; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    lead: "default",
    scheduled: "secondary",
    in_shop: "outline",
    awaiting_pickup: "secondary",
    complete: "outline",
  };
  return variants[status] || "default";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
