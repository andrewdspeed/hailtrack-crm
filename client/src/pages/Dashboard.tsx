import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Users, Car, ClipboardCheck, TrendingUp, DollarSign, Calendar } from "lucide-react";
import QuickStats from "@/components/QuickStats";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: todayAssignments } = trpc.technicians.getTodayAssignments.useQuery();
  const { data: availableLoaners } = trpc.loaners.getAvailable.useQuery();
  const { data: pendingInspections } = trpc.inspections.getPending.useQuery();
  const { data: leads } = trpc.leads.list.useQuery();

  // Calculate some additional stats
  const activeLeads = leads?.filter(l => l.status === "active") || [];
  const inShopLeads = leads?.filter(l => l.status === "in_shop") || [];
  const completedThisWeek = leads?.filter(l => {
    if (l.status !== "completed") return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(l.updatedAt) > weekAgo;
  }) || [];

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your operations and key metrics
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 dashboard-metrics">
          <QuickStats />
        </div>

        {/* Operational Widgets */}
        <div className="mb-6 dashboard-operations">
          <h2 className="text-xl font-semibold mb-4">Today's Operations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Today's Assignments Widget */}
            <Card 
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-600" 
              onClick={() => setLocation("/technicians")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{todayAssignments?.length || 0}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Today's Assignments</p>
                <p className="text-sm text-muted-foreground">
                  {todayAssignments?.filter((a: any) => a.status === "in_progress").length || 0} in progress
                </p>
              </div>
            </Card>

            {/* Available Loaners Widget */}
            <Card 
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-green-600" 
              onClick={() => setLocation("/loaners")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Car className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{availableLoaners?.length || 0}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Available Loaners</p>
                <p className="text-sm text-muted-foreground">
                  Ready to assign
                </p>
              </div>
            </Card>

            {/* Pending Inspections Widget */}
            <Card 
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-orange-600" 
              onClick={() => setLocation("/leads")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <ClipboardCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{pendingInspections?.length || 0}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Pending Inspections</p>
                <p className="text-sm text-muted-foreground">
                  Awaiting completion
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="dashboard-performance">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Active Leads */}
            <Card className="p-6 border-l-4 border-l-purple-600">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{activeLeads.length}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Active Leads</p>
                <p className="text-sm text-muted-foreground">
                  Currently in pipeline
                </p>
              </div>
            </Card>

            {/* In Shop */}
            <Card className="p-6 border-l-4 border-l-indigo-600">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{inShopLeads.length}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">In Shop</p>
                <p className="text-sm text-muted-foreground">
                  Currently being repaired
                </p>
              </div>
            </Card>

            {/* Completed This Week */}
            <Card className="p-6 border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{completedThisWeek.length}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Completed (7d)</p>
                <p className="text-sm text-muted-foreground">
                  Jobs finished this week
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
