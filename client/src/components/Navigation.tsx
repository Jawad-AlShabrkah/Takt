import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Menu, LogOut, Settings, LayoutGrid, Package, Layers } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Factory Floor", href: "/factory-floor", icon: Layers },
    { label: "Products", href: "/products", icon: Package },
  ];

  const isActive = (href: string) => location === href;

  return (
    <nav className="border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TK</span>
            </div>
            <h1 className="text-xl font-bold text-foreground hidden sm:block">Takt</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLocation(item.href)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="hidden sm:inline text-sm">{user.name || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium text-foreground">
                    {user.email}
                  </div>
                  {user.role && (
                    <div className="px-2 py-1 text-xs text-muted-foreground capitalize">
                      Role: {user.role}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/settings")} className="gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="gap-2 text-destructive">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => window.location.href = "/login"}>
                Login
              </Button>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.href}
                        onClick={() => {
                          setLocation(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className="gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
