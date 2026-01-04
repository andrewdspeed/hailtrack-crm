import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, AlertTriangle } from "lucide-react";

export default function Comparison() {
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 font-heading">Feature Comparison</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            A detailed breakdown of how each open-source solution stacks up against your specific requirements for the Hail Solutions Group CRM.
          </p>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-lg">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[200px] font-bold text-base">Feature</TableHead>
                  <TableHead className="min-w-[180px]">
                    <div className="flex flex-col gap-1 py-2">
                      <span className="font-bold text-primary text-base">EspoCRM</span>
                      <Badge variant="outline" className="w-fit text-[10px]">Recommended Backend</Badge>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[180px]">
                    <div className="flex flex-col gap-1 py-2">
                      <span className="font-bold text-base">DjangoCRM</span>
                      <Badge variant="outline" className="w-fit text-[10px]">Python Alternative</Badge>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[180px]">
                    <div className="flex flex-col gap-1 py-2">
                      <span className="font-bold text-base">SuiteCRM</span>
                      <Badge variant="outline" className="w-fit text-[10px]">Enterprise Standard</Badge>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[180px]">
                    <div className="flex flex-col gap-1 py-2">
                      <span className="font-bold text-secondary-foreground text-base">React Native App</span>
                      <Badge variant="outline" className="w-fit text-[10px]">Mobile Frontend</Badge>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/10">
                  <TableCell className="font-medium">Lead Management</TableCell>
                  <TableCell><Status type="success" text="Excellent" /></TableCell>
                  <TableCell><Status type="success" text="Excellent" /></TableCell>
                  <TableCell><Status type="success" text="Excellent" /></TableCell>
                  <TableCell><Status type="warning" text="Basic (Frontend)" /></TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Mobile Native</TableCell>
                  <TableCell><Status type="error" text="No (Responsive Web)" /></TableCell>
                  <TableCell><Status type="error" text="No (Responsive Web)" /></TableCell>
                  <TableCell><Status type="error" text="No (Responsive Web)" /></TableCell>
                  <TableCell><Status type="success" text="Yes (Native)" /></TableCell>
                </TableRow>
                
                <TableRow className="bg-muted/10">
                  <TableCell className="font-medium">GPS Geotagging</TableCell>
                  <TableCell><Status type="error" text="No Built-in" /></TableCell>
                  <TableCell><Status type="warning" text="Web Forms Only" /></TableCell>
                  <TableCell><Status type="error" text="No Built-in" /></TableCell>
                  <TableCell><Status type="success" text="Easy to Add" /></TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Scheduling</TableCell>
                  <TableCell><Status type="success" text="Built-in" /></TableCell>
                  <TableCell><Status type="success" text="Built-in" /></TableCell>
                  <TableCell><Status type="success" text="Built-in" /></TableCell>
                  <TableCell><Status type="error" text="No Built-in" /></TableCell>
                </TableRow>
                
                <TableRow className="bg-muted/10">
                  <TableCell className="font-medium">SMS Templates</TableCell>
                  <TableCell><Status type="warning" text="Via Integration" /></TableCell>
                  <TableCell><Status type="warning" text="Via Integration" /></TableCell>
                  <TableCell><Status type="warning" text="Via Integration" /></TableCell>
                  <TableCell><Status type="warning" text="Via Integration" /></TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Customization</TableCell>
                  <TableCell><Status type="success" text="High (5/5)" /></TableCell>
                  <TableCell><Status type="success" text="High (4/5)" /></TableCell>
                  <TableCell><Status type="success" text="High (4/5)" /></TableCell>
                  <TableCell><Status type="success" text="High (5/5)" /></TableCell>
                </TableRow>
                
                <TableRow className="bg-muted/10">
                  <TableCell className="font-medium">Modern Tech Stack</TableCell>
                  <TableCell><Status type="success" text="Yes (PHP 8/SPA)" /></TableCell>
                  <TableCell><Status type="success" text="Yes (Django)" /></TableCell>
                  <TableCell><Status type="error" text="No (Legacy PHP)" /></TableCell>
                  <TableCell><Status type="success" text="Yes (React Native)" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Why the Hybrid Stack Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No single open-source CRM offers both "Enterprise-grade Backend" and "Field-Sales Mobile Features" out of the box.
              </p>
              <p className="text-muted-foreground">
                By combining <strong>EspoCRM</strong> (for data management) with a custom <strong>React Native App</strong> (for field agents), you get the best of both worlds: a powerful office dashboard and a high-performance mobile tool with GPS tracking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">The Notification Gap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Most CRMs treat SMS as an afterthought. For your requirement of "auto-text templates for all stages," a dedicated engine is needed.
              </p>
              <p className="text-muted-foreground">
                <strong>Novu</strong> fills this gap perfectly. It connects to your CRM and handles complex messaging workflows (e.g., "Send SMS 2 days after quote if no reply"), which standard CRMs struggle to do natively.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function Status({ type, text }: { type: "success" | "warning" | "error", text: string }) {
  if (type === "success") {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
        <Check className="h-4 w-4" /> {text}
      </div>
    );
  }
  if (type === "warning") {
    return (
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
        <AlertTriangle className="h-4 w-4" /> {text}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
      <X className="h-4 w-4" /> {text}
    </div>
  );
}
