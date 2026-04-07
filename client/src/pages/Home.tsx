import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowRight, BarChart3, Boxes, Zap } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <span className="text-sm font-medium text-accent">Factory Floor Management</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Takt Factory Floor
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Real-time visualization and management of GIS products across your factory floor with drag-and-drop simplicity.
            </p>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={() => (window.location.href = "/api/oauth/login")}
            className="gap-2 h-12 px-8 text-base"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Button>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Boxes className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Product Management</h3>
              <p className="text-sm text-muted-foreground">
                Track and manage GIS products with real-time status updates and metadata.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Drag & Drop Interface</h3>
              <p className="text-sm text-muted-foreground">
                Intuitive drag-and-drop movement between factory areas with real-time updates.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Analytics & Insights</h3>
              <p className="text-sm text-muted-foreground">
                Dashboard with occupancy metrics, status distribution, and activity tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Welcome to Takt</h1>
            <p className="text-lg text-muted-foreground">
              Manage your factory floor operations with real-time visualization and control.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/dashboard")}
              className="h-24 flex-col gap-2 justify-center"
            >
              <BarChart3 className="w-6 h-6" />
              <span>View Dashboard</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/factory-floor")}
              className="h-24 flex-col gap-2 justify-center"
            >
              <Boxes className="w-6 h-6" />
              <span>Factory Floor</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/products")}
              className="h-24 flex-col gap-2 justify-center"
            >
              <Zap className="w-6 h-6" />
              <span>Manage Products</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
