import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Check, ExternalLink, Github, Star, GitFork } from "lucide-react";

export default function TopPicks() {
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 font-heading">Top Recommendations</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Based on your specific requirements for geotagging, automation, and vehicle tracking, 
            we've selected the best open-source foundations.
          </p>
        </div>

        <Tabs defaultValue="recommended" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="grid w-full max-w-md grid-cols-3 h-12 p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="recommended" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Best Overall</TabsTrigger>
              <TabsTrigger value="fastest" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Fastest Deploy</TabsTrigger>
              <TabsTrigger value="custom" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Full Custom</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recommended" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Recommendation Card */}
              <Card className="lg:col-span-2 border-primary/20 shadow-xl shadow-primary/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-xl font-bold text-sm z-10">
                  #1 Choice
                </div>
                <div className="h-2 bg-primary w-full"></div>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">The Hybrid Stack</Badge>
                    <Badge variant="secondary">Most Flexible</Badge>
                  </div>
                  <CardTitle className="text-3xl font-heading">EspoCRM + React Native + Novu</CardTitle>
                  <CardDescription className="text-lg">
                    A powerful combination of a robust backend CRM, a custom mobile app for field sales, and a dedicated notification engine.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">1</div>
                        Backend: EspoCRM
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Handles the customer database, vehicle entities, and business logic. Highly customizable with a REST API.
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> 2.7k Stars</span>
                        <span className="flex items-center gap-1"><GitFork className="h-3 w-3" /> 772 Forks</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground text-xs font-bold">2</div>
                        Mobile: React Native Template
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Custom mobile app for sales reps to geotag visits, take photos of damage, and manage leads in the field.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-xs font-bold">3</div>
                        Notifications: Novu
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manages all auto-text templates and SMS workflows for every stage of the customer journey.
                      </p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                      <h4 className="font-semibold text-sm mb-2">Why this wins:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>True mobile-first experience for field teams</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>Precise GPS geotagging capabilities</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>Separation of concerns (CRM vs. Messaging)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t border-border/40 flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">
                    Est. Dev Time: <span className="text-foreground">3-6 Months</span>
                  </div>
                  <Button>View Implementation Plan <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </CardFooter>
              </Card>

              {/* Sidebar Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Suitability Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-5xl font-bold text-primary">95</span>
                      <span className="text-xl text-muted-foreground mb-1">/100</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[95%]"></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Key Repositories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RepoLink 
                      name="espocrm/espocrm" 
                      desc="Backend CRM Core"
                      stars="2.7k"
                      url="https://github.com/espocrm/espocrm"
                    />
                    <RepoLink 
                      name="novuhq/novu" 
                      desc="Notification Engine"
                      stars="38.3k"
                      url="https://github.com/novuhq/novu"
                    />
                    <RepoLink 
                      name="mah-shamim/crm-app" 
                      desc="Mobile Template"
                      stars="8"
                      url="https://github.com/mah-shamim/crm-lead-management-app-react-native"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fastest" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-secondary/20 shadow-xl shadow-secondary/5">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary/20">Single Platform</Badge>
                </div>
                <CardTitle className="text-3xl font-heading">SuiteCRM or EspoCRM (Standalone)</CardTitle>
                <CardDescription className="text-lg">
                  Deploying a single, feature-rich CRM platform and adapting it for mobile use via web browser.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Pros</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-secondary-foreground shrink-0" />
                      <span>Fastest time to market (1-2 months)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-secondary-foreground shrink-0" />
                      <span>Lower development cost and complexity</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-secondary-foreground shrink-0" />
                      <span>Proven, stable enterprise features</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Cons</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="h-5 w-5 flex items-center justify-center rounded-full bg-destructive/10 text-destructive text-xs font-bold shrink-0">✕</span>
                      <span>No native mobile features (offline mode, background GPS)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="h-5 w-5 flex items-center justify-center rounded-full bg-destructive/10 text-destructive text-xs font-bold shrink-0">✕</span>
                      <span>Geotagging is limited to browser capabilities</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-heading">Full Custom Build</CardTitle>
                <CardDescription className="text-lg">
                  Building from scratch using Django/Node.js backend and React Native mobile app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  This option offers 100% tailor-made features but comes with the highest cost and longest timeline (6-12 months). 
                  Recommended only if the hybrid stack cannot meet specific critical requirements.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="font-bold text-2xl mb-1">100%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Customizable</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="font-bold text-2xl mb-1">High</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Cost</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="font-bold text-2xl mb-1">12mo</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Timeline</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function RepoLink({ name, desc, stars, url }: { name: string, desc: string, stars: string, url: string }) {
  return (
    <a 
      href={url}
      target="_blank"
      rel="noreferrer" 
      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="bg-muted p-2 rounded-md group-hover:bg-background transition-colors">
          <Github className="h-5 w-5" />
        </div>
        <div>
          <div className="font-medium text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium bg-primary/5 text-primary px-2 py-1 rounded">
        <Star className="h-3 w-3 fill-primary" /> {stars}
      </div>
    </a>
  );
}
