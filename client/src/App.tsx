import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FactoryFloor from "./pages/FactoryFloor";
import Dashboard from "./pages/Dashboard";
import ProductManagement from "./pages/ProductManagement";
import AreaManagement from "./pages/AreaManagement";
import Navigation from "./components/Navigation";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/factory-floor"} component={FactoryFloor} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/products"} component={ProductManagement} />
      <Route path={"/areas"} component={AreaManagement} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="flex h-screen flex-col bg-background text-foreground">
            <Navigation />
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
