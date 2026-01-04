import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Code, Database, LayoutDashboard, Smartphone, Bell } from "lucide-react";

export default function Implementation() {
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 font-heading">Implementation Strategy</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            A phased approach to building your custom CRM ecosystem, minimizing risk while delivering value early.
          </p>
        </div>

        <div className="relative border-l-2 border-primary/20 ml-4 md:ml-12 space-y-12 md:space-y-20 pb-12">
          {/* Phase 1 */}
          <div className="relative pl-8 md:pl-12">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background"></div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
                  Phase 1 • Months 1-2
                </div>
                <h2 className="text-2xl font-bold font-heading mb-4">Core CRM & Database Setup</h2>
                <p className="text-muted-foreground mb-6">
                  Establish the single source of truth for your customer and vehicle data.
                </p>
                <ul className="space-y-3 mb-6">
                  <StepItem text="Deploy EspoCRM on secure cloud infrastructure" />
                  <StepItem text="Configure custom entities: 'Vehicles', 'Damage Assessments'" />
                  <StepItem text="Import existing customer data" />
                  <StepItem text="Set up user roles (Admin, Sales, Technician)" />
                </ul>
              </div>
              <div className="w-full md:w-1/3">
                <Card className="bg-muted/30 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-primary" />
                      <span className="font-medium">Central Database</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      <span className="font-medium">Admin Dashboard</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="relative pl-8 md:pl-12">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-secondary ring-4 ring-background"></div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary-foreground mb-2">
                  Phase 2 • Months 3-4
                </div>
                <h2 className="text-2xl font-bold font-heading mb-4">Mobile Field App</h2>
                <p className="text-muted-foreground mb-6">
                  Empower your sales team with the tools they need on the road.
                </p>
                <ul className="space-y-3 mb-6">
                  <StepItem text="Customize React Native template" />
                  <StepItem text="Implement GPS tracking logic (background & foreground)" />
                  <StepItem text="Build 'New Lead' form with photo upload" />
                  <StepItem text="Connect mobile app to EspoCRM API" />
                </ul>
              </div>
              <div className="w-full md:w-1/3">
                <Card className="bg-muted/30 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-secondary-foreground" />
                      <span className="font-medium">Field Sales App</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Code className="h-5 w-5 text-secondary-foreground" />
                      <span className="font-medium">API Integration</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="relative pl-8 md:pl-12">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-muted-foreground ring-4 ring-background"></div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground mb-2">
                  Phase 3 • Months 5-6
                </div>
                <h2 className="text-2xl font-bold font-heading mb-4">Automation & Notifications</h2>
                <p className="text-muted-foreground mb-6">
                  Streamline communication and reduce manual follow-up work.
                </p>
                <ul className="space-y-3 mb-6">
                  <StepItem text="Set up Novu notification engine" />
                  <StepItem text="Design SMS templates for all 5 pipeline stages" />
                  <StepItem text="Configure triggers (e.g., 'Status changed to Scheduled')" />
                  <StepItem text="Implement scheduling calendar for pickups" />
                </ul>
              </div>
              <div className="w-full md:w-1/3">
                <Card className="bg-muted/30 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-foreground" />
                      <span className="font-medium">Automated SMS</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="h-5 w-5 text-foreground" />
                      <span className="font-medium">Scheduling System</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-primary/5 rounded-2xl p-8 border border-primary/10 text-center">
          <h3 className="text-2xl font-bold font-heading mb-4">Ready to Start?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            The open-source foundations are ready. The next step is to set up the development environment and begin the Phase 1 deployment.
          </p>
          <Button size="lg" className="h-12 px-8">
            Download Technical Spec <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}

function StepItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
      <span>{text}</span>
    </li>
  );
}
