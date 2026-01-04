import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Database, MapPin, MessageSquare, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
        
        <div className="container flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Research Complete
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mb-6 font-heading bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            The Perfect CRM Stack for <br className="hidden sm:block" />
            <span className="text-primary">Hail Solutions Group</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
            We've analyzed 6 top-tier open source repositories to build your custom in-house CRM. 
            Discover the optimal combination for geotagging, lead tracking, and automated customer communication.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/top-picks">
              <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105">
                View Recommendations <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/comparison">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-accent/50">
                Compare Options
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Requirements Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 font-heading">Tailored to Your Requirements</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We focused our research on finding solutions that specifically address the unique needs of automotive hail damage repair operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<MapPin className="h-8 w-8 text-primary" />}
              title="Field Geotagging"
              description="Track sales visits and map affected neighborhoods with precise GPS coordinates."
              image="/images/feature-geotagging.png"
            />
            <FeatureCard 
              icon={<MessageSquare className="h-8 w-8 text-secondary-foreground" />}
              title="Auto-Text Templates"
              description="Automated SMS workflows for every stage from prospecting to referral requests."
              image="/images/feature-automation.png"
              color="secondary"
            />
            <FeatureCard 
              icon={<Calendar className="h-8 w-8 text-primary" />}
              title="Smart Scheduling"
              description="Coordinate vehicle pickups and drop-offs with integrated calendar systems."
              image="/images/feature-scheduling.png"
            />
            <FeatureCard 
              icon={<Database className="h-8 w-8 text-secondary-foreground" />}
              title="Vehicle Database"
              description="Custom entities to track VINs, damage assessments, and repair status."
              image="/images/hero-bg.png"
              color="secondary"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section (Required) */}
      <section className="py-20">
        <div className="container">
          <div className="bg-primary/5 rounded-3xl p-8 md:p-12 lg:p-16 border border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight mb-8 font-heading text-center">Why This Interactive Report?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <BenefitItem 
                  title="Explore Data More Intuitively"
                  description="Navigate through complex technical comparisons with visual charts and interactive elements instead of dense text."
                />
                <BenefitItem 
                  title="Understand Trends Better"
                  description="Visualize the strengths and weaknesses of each platform to make informed decisions about your tech stack."
                />
                <BenefitItem 
                  title="Easily Save or Share"
                  description="This static web report can be hosted anywhere, bookmarked, and shared with your entire technical team."
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function FeatureCard({ icon, title, description, image, color = "primary" }: { icon: React.ReactNode, title: string, description: string, image: string, color?: "primary" | "secondary" }) {
  return (
    <Card className="overflow-hidden border-border/50 transition-all hover:shadow-lg hover:-translate-y-1 group h-full">
      <div className="h-48 overflow-hidden bg-muted relative">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
        <div className={`absolute bottom-4 left-4 p-3 rounded-xl ${color === "primary" ? "bg-primary/10" : "bg-secondary/20"} backdrop-blur-md`}>
          {icon}
        </div>
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-heading">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function BenefitItem({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-4">
      <div className="mb-4 rounded-full bg-background p-3 shadow-sm ring-1 ring-border">
        <CheckCircle2 className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-bold mb-2 font-heading">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
