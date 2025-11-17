import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import CreateMenu from "@/pages/create-menu";
import SplitBill from "@/pages/split-bill";
import Results from "@/pages/results";
import EditMenu from "@/pages/edit-menu";
import ViewSplit from "@/pages/view-split";
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
