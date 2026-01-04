import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function QuickStats() {
  const { data: leads } = trpc.leads.list.useQuery();
  const { data: followUps } = trpc.followUps.list.useQuery();

  // Calculate stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const newLeadsToday = leads?.filter(l => {
    const createdAt = new Date(l.createdAt);
    return createdAt >= todayStart;
  }).length || 0;

  const followUpsDueToday = followUps?.filter(f => {
    if (f.completed) return false;
    const dueDate = new Date(f.dueDate);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  }).length || 0;

  const activeLeads = leads?.filter(l => 
    l.status !== 'complete' && l.status !== 'cancelled'
  ).length || 0;

  const completedThisWeek = leads?.filter(l => {
    if (l.status !== 'complete') return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const updatedAt = new Date(l.updatedAt);
    return updatedAt >= weekAgo;
  }).length || 0;

  const inShop = leads?.filter(l => l.status === 'in_shop').length || 0;

  const awaitingPickup = leads?.filter(l => l.status === 'awaiting_pickup').length || 0;

  const stats = [
    {
      title: "New Leads Today",
      value: newLeadsToday,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Follow-ups Due",
      value: followUpsDueToday,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Active Leads",
      value: activeLeads,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "In Shop",
      value: inShop,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Awaiting Pickup",
      value: awaitingPickup,
      icon: CheckCircle,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Completed (7d)",
      value: completedThisWeek,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
