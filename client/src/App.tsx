import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/navbar";

import Dashboard from "@/pages/dashboard";
import TelescopeControl from "@/pages/telescope-control";
import Users from "@/pages/admin/users";
import NotFound from "@/pages/not-found";
import { SimpleMapTest } from "@/components/telescope/simple-map-test";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/telescope/:id" component={TelescopeControl} />
      <Route path="/admin/users" component={Users} />
      <Route path="/sky-map-test" component={SimpleMapTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-astro-dark text-astro-lightText flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
