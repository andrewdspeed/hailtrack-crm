import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Users, Target, Award, Download, DollarSign, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDemoPermissions } from "@/hooks/useDemoPermissions";
import { PERMISSIONS } from "@/hooks/usePermissions";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { hasPermission, isLoading: permissionsLoading } = useDemoPermissions();
  
  // Permission check
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!hasPermission(PERMISSIONS.VIEW_ANALYTICS)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md text-center">
          <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to view analytics.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your administrator if you need access to analytics and reports.
          </p>
        </Card>
      </div>
    );
  }
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  
  const { data: agentPerformance, isLoading: loadingAgents } = trpc.analytics.getAgentPerformance.useQuery(dateRange);
  const { data: monthlyRevenue, isLoading: loadingRevenue } = trpc.analytics.getMonthlyRevenue.useQuery({ months: 6 });
  const { data: overallStats, isLoading: loadingStats } = trpc.analytics.getOverallStats.useQuery();
  const { data: conversionFunnel, isLoading: loadingFunnel } = trpc.analytics.getConversionFunnel.useQuery(dateRange);
  const { data: revenueTrends, isLoading: loadingTrends } = trpc.analytics.getRevenueTrends.useQuery({ ...dateRange, groupBy: 'month' });
  const { data: repairDuration, isLoading: loadingDuration } = trpc.analytics.getRepairDuration.useQuery(dateRange);
  
  // Prepare data for charts
  const statusDistribution = agentPerformance?.reduce((acc, agent) => {
    acc.newLeads = (acc.newLeads || 0) + agent.newLeads;
    acc.scheduled = (acc.scheduled || 0) + agent.scheduled;
    acc.inShop = (acc.inShop || 0) + agent.inShop;
    acc.awaitingPickup = (acc.awaitingPickup || 0) + agent.awaitingPickup;
    acc.completed = (acc.completed || 0) + agent.completed;
    return acc;
  }, {} as Record<string, number>);
  
  const pieData = statusDistribution ? [
    { name: 'New Leads', value: statusDistribution.newLeads },
    { name: 'Scheduled', value: statusDistribution.scheduled },
    { name: 'In Shop', value: statusDistribution.inShop },
    { name: 'Awaiting Pickup', value: statusDistribution.awaitingPickup },
    { name: 'Completed', value: statusDistribution.completed },
  ] : [];
  
  // Prepare agent performance bar chart data
  const agentBarData = agentPerformance?.map(agent => ({
    name: agent.agentName,
    'Total Leads': agent.totalLeads,
    'Completed': agent.completed,
    'Conversion Rate': agent.conversionRate,
  })) || [];
  
  // Prepare conversion funnel data
  const funnelData = conversionFunnel ? [
    { stage: 'Lead', count: conversionFunnel.lead, percentage: 100 },
    { stage: 'Scheduled', count: conversionFunnel.scheduled, percentage: conversionFunnel.total > 0 ? Math.round((conversionFunnel.scheduled / conversionFunnel.total) * 100) : 0 },
    { stage: 'In Shop', count: conversionFunnel.inShop, percentage: conversionFunnel.total > 0 ? Math.round((conversionFunnel.inShop / conversionFunnel.total) * 100) : 0 },
    { stage: 'Awaiting Pickup', count: conversionFunnel.awaitingPickup, percentage: conversionFunnel.total > 0 ? Math.round((conversionFunnel.awaitingPickup / conversionFunnel.total) * 100) : 0 },
    { stage: 'Complete', count: conversionFunnel.complete, percentage: conversionFunnel.total > 0 ? Math.round((conversionFunnel.complete / conversionFunnel.total) * 100) : 0 },
  ] : [];
  
  // Prepare revenue trends data
  const revenueChartData = revenueTrends?.map(trend => ({
    period: trend.period,
    revenue: trend.revenue,
    invoices: trend.invoiceCount,
  })) || [];
  
  // CSV export function
  const exportToCSV = () => {
    if (!agentPerformance) return;
    
    const headers = ['Agent', 'Total Leads', 'New', 'Scheduled', 'In Shop', 'Awaiting Pickup', 'Completed', 'Conversion Rate'];
    const rows = agentPerformance.map(agent => [
      agent.agentName,
      agent.totalLeads,
      agent.newLeads,
      agent.scheduled,
      agent.inShop,
      agent.awaitingPickup,
      agent.completed,
      `${agent.conversionRate}%`,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <AppLayout>
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/leads")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Agent performance and key metrics</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.totalLeads || 0}</div>
              <p className="text-xs text-muted-foreground">
                {overallStats?.activeLeads || 0} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.completedLeads || 0}</div>
              <p className="text-xs text-muted-foreground">
                {overallStats?.conversionRate || 0}% conversion rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.totalAgents || 0}</div>
              <p className="text-xs text-muted-foreground">
                Team members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Repair Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repairDuration?.averageDays || 0}</div>
              <p className="text-xs text-muted-foreground">
                days to complete
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* New Charts: Conversion Funnel & Revenue Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Lead progression through pipeline stages</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFunnel ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" label={{ position: 'right', formatter: (value: number, entry: any) => `${value} (${entry.percentage}%)` }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly invoice revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : revenueChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No revenue data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Performance Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Total leads and completion rates by agent</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAgents ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Total Leads" fill="#3b82f6" />
                    <Bar dataKey="Completed" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Status Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Distribution</CardTitle>
              <CardDescription>Current pipeline breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAgents ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Agent Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Leaderboard</CardTitle>
            <CardDescription>Top performers ranked by conversion rate</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAgents ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : (
              <div className="space-y-4">
                {agentPerformance
                  ?.sort((a, b) => b.conversionRate - a.conversionRate)
                  .map((agent, index) => (
                    <div key={agent.agentId || index} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{agent.agentName}</div>
                          <div className="text-sm text-muted-foreground">
                            {agent.totalLeads} leads • {agent.completed} completed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Conversion Rate</div>
                          <div className="text-2xl font-bold text-primary">{agent.conversionRate}%</div>
                        </div>
                        {index === 0 && (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            <Award className="h-3 w-3 mr-1" />
                            Top Performer
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Detailed Agent Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Agent Statistics</CardTitle>
            <CardDescription>Complete breakdown by status stage</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAgents ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold">Agent</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                      <th className="text-right p-3 font-semibold">New</th>
                      <th className="text-right p-3 font-semibold">Scheduled</th>
                      <th className="text-right p-3 font-semibold">In Shop</th>
                      <th className="text-right p-3 font-semibold">Pickup</th>
                      <th className="text-right p-3 font-semibold">Complete</th>
                      <th className="text-right p-3 font-semibold">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerformance?.map((agent, index) => (
                      <tr key={agent.agentId || index} className="border-b border-border hover:bg-muted/50">
                        <td className="p-3 font-medium">{agent.agentName}</td>
                        <td className="text-right p-3">{agent.totalLeads}</td>
                        <td className="text-right p-3">{agent.newLeads}</td>
                        <td className="text-right p-3">{agent.scheduled}</td>
                        <td className="text-right p-3">{agent.inShop}</td>
                        <td className="text-right p-3">{agent.awaitingPickup}</td>
                        <td className="text-right p-3 font-semibold text-green-600">{agent.completed}</td>
                        <td className="text-right p-3">
                          <Badge variant={agent.conversionRate >= 50 ? "default" : "secondary"}>
                            {agent.conversionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </AppLayout>
  );
}
