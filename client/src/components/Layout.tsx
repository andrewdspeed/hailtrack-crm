import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { name: "Overview", href: "/" },
    { name: "Top Picks", href: "/top-picks" },
    { name: "Comparison", href: "/comparison" },
    { name: "Implementation", href: "/implementation" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary">
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              H
            </div>
            <span className="text-lg font-bold tracking-tight font-heading">Hail Solutions Group</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary cursor-pointer",
                  location === item.href
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Research Report
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border/40 bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xs">
                  H
                </div>
                <span className="font-bold font-heading">Hail Solutions Group</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Custom CRM research and implementation strategy for automotive hail damage repair operations.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Research Areas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Lead Management</li>
                <li>Field Sales Geotagging</li>
                <li>Automated Messaging</li>
                <li>Vehicle Database</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Recommended Stack</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>EspoCRM / DjangoCRM</li>
                <li>React Native Mobile App</li>
                <li>Novu Notifications</li>
                <li>PostgreSQL Database</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            © 2025 Hail Solutions Group Research. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
