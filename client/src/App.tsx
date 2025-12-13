import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLoader } from "@/components/app-loader";
import Home from "@/pages/home";
import CreateMenu from "@/pages/create-menu";
import SplitBill from "@/pages/split-bill";
import Results from "@/pages/results";
import EditMenu from "@/pages/edit-menu";
import ViewSplit from "@/pages/view-split";
import AdjustSplit from "@/pages/adjust-split";
import MySplits from "@/pages/my-splits";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create-menu" component={CreateMenu} />
      <Route path="/split-bill" component={SplitBill} />
      <Route path="/results" component={Results} />
      <Route path="/edit-menu/:code" component={EditMenu} />
      <Route path="/split/:code" component={ViewSplit} />
      <Route path="/adjust-split/:code" component={AdjustSplit} />
      <Route path="/my-splits" component={MySplits} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => new Promise(resolve => setTimeout(resolve, 500)), // Artificial min-load time
    retry: false
  });

  if (isLoading) return <AppLoader />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen bg-background font-sans antialiased relative overflow-hidden">
          {/* Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
